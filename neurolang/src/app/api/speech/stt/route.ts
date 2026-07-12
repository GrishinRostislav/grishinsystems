import { NextResponse } from 'next/server';
import openai from '@/lib/openai';
import { getSessionUser } from '@/lib/auth';

// Simple Levenshtein distance calculation to score pronunciation
function getLevenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // Deletion
          dp[i][j - 1] + 1,    // Insertion
          dp[i - 1][j - 1] + 1 // Substitution
        );
      }
    }
  }
  return dp[m][n];
}

function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'—\n]/g, '') // remove punctuation
    .replace(/\s+/g, ' ') // normalize whitespace
    .trim();
}

function calculateMatchScore(expected: string, recognized: string): number {
  const s1 = cleanText(expected);
  const s2 = cleanText(recognized);
  
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 100;

  const maxLen = Math.max(s1.length, s2.length);
  const distance = getLevenshteinDistance(s1, s2);
  
  const score = ((maxLen - distance) / maxLen) * 100;
  return Math.max(0, Math.round(score));
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;
    const expectedText = formData.get('expectedText') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    if (!expectedText) {
      return NextResponse.json({ error: 'Expected text is required' }, { status: 400 });
    }

    if (process.env.OPENAI_API_KEY === 'dummy-key-for-dev' || !process.env.OPENAI_API_KEY) {
      // Dev local fallback mode without API key
      return NextResponse.json({
        recognizedText: expectedText,
        score: 100,
        isMock: true,
      });
    }

    // Convert Blob to standard Node File object for OpenAI
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.type.split('/')[1] || 'webm';
    const audioFile = new File([buffer], `audio.${fileExtension}`, { type: file.type });

    // Send to OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    const recognizedText = transcription.text;
    const score = calculateMatchScore(expectedText, recognizedText);

    return NextResponse.json({
      recognizedText,
      expectedText,
      score, // Percentage 0 - 100
      passed: score >= 75, // consider passed if score is >= 75%
    });
  } catch (error) {
    console.error('STT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
