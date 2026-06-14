import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    let attempt = await prisma.loginAttempt.findUnique({ where: { ip } });
    
    if (attempt && attempt.lockoutAt && new Date() < attempt.lockoutAt) {
      return NextResponse.json({ error: 'Too many attempts. Locked out.' }, { status: 429 });
    }

    const APP_PASSWORD = process.env.APP_PASSWORD;
    
    if (!APP_PASSWORD) {
      return NextResponse.json({ error: 'Server configuration error: APP_PASSWORD environment variable is not defined.' }, { status: 500 });
    }

    if (password === APP_PASSWORD) {
      // Reset attempts on success
      if (attempt) {
        await prisma.loginAttempt.update({
          where: { ip },
          data: { attempts: 0, lockoutAt: null }
        });
      }

      // Set a simple auth cookie
      const cookieStore = await cookies();
      cookieStore.set('auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      });

      return NextResponse.json({ success: true });
    } else {
      // Increment failures
      const newAttempts = (attempt?.attempts || 0) + 1;
      let lockoutAt = null;
      
      if (newAttempts >= 3) {
        lockoutAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      }

      await prisma.loginAttempt.upsert({
        where: { ip },
        update: { attempts: newAttempts, lockoutAt },
        create: { ip, attempts: 1, lockoutAt }
      });

      if (lockoutAt) {
        return NextResponse.json({ error: 'Locked out due to too many attempts.' }, { status: 429 });
      }

      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
  } catch (error: any) {
    console.error("Auth error:", error);
    return NextResponse.json({ 
      error: `Internal Server Error: ${error.message || error}`
    }, { status: 500 });
  }
}
