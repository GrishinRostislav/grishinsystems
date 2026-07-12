import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';
import prisma from '@/lib/db';
import openai from '@/lib/openai';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // Optional: Protect route so only authenticated users can trigger TTS (saves cost)
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, language = 'en', voice = 'alloy' } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const trimmedText = text.trim();
    
    // Generate textHash to identify unique requests
    const textHash = crypto
      .createHash('sha256')
      .update(`${trimmedText.toLowerCase()}-${language}-${voice}`)
      .digest('hex');

    // 1. Check database cache
    const cachedSpeech = await prisma.speechCache.findUnique({
      where: { textHash },
    });

    if (cachedSpeech) {
      return NextResponse.json({ audioUrl: cachedSpeech.audioUrl, cached: true });
    }

    // 2. Generate new speech via OpenAI TTS if not cached
    if (process.env.OPENAI_API_KEY === 'dummy-key-for-dev' || !process.env.OPENAI_API_KEY) {
      // In dev with no API key, return a mock or browser synthesis trigger
      return NextResponse.json({ 
        audioUrl: '', 
        useBrowserSynthesis: true, 
        text: trimmedText, 
        language 
      });
    }

    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: trimmedText,
    });

    const buffer = Buffer.from(await mp3Response.arrayBuffer());
    const filename = `tts-${textHash}.mp3`;
    let audioUrl = '';

    // 3. Store the audio file (Vercel Blob in production, local file in dev)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(filename, buffer, {
        access: 'public',
        addRandomSuffix: false,
      });
      audioUrl = blob.url;
    } else {
      // Dev local fallback
      const publicAudioDir = path.join(process.cwd(), 'public', 'audio');
      if (!fs.existsSync(publicAudioDir)) {
        fs.mkdirSync(publicAudioDir, { recursive: true });
      }
      const localFilePath = path.join(publicAudioDir, filename);
      fs.writeFileSync(localFilePath, buffer);
      audioUrl = `/neurolang/audio/${filename}`;
    }

    // 4. Save to database cache
    await prisma.speechCache.create({
      data: {
        textHash,
        text: trimmedText,
        language,
        voice,
        audioUrl,
      },
    });

    return NextResponse.json({ audioUrl, cached: false });
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
