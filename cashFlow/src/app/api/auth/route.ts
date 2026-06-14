import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

      const response = NextResponse.json({ success: true });
      
      // Set the auth cookie manually using the HTTP header to bypass Next.js basePath auto-prefixing.
      // This ensures the cookie path is exactly '/' and is sent for both '/cashFlow' and '/cashFlow/' requests.
      const isProd = process.env.NODE_ENV === 'production';
      const cookieValue = `auth=authenticated; Path=/; HttpOnly; ${isProd ? 'Secure;' : ''} Max-Age=2592000; SameSite=Lax`;
      response.headers.append('Set-Cookie', cookieValue);

      return response;
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
    
    const rawUrl = process.env.POSTGRES_PRISMA_URL || "undefined";
    const maskedUrl = rawUrl.replace(/:[^:@]+@/, ':****@');

    return NextResponse.json({ 
      error: `Internal Server Error: ${error.message || error}`,
      debug: {
        POSTGRES_PRISMA_URL: maskedUrl,
        length: rawUrl.length,
        startsWithQuote: rawUrl.startsWith('"'),
        endsWithQuote: rawUrl.endsWith('"'),
        type: typeof rawUrl
      }
    }, { status: 500 });
  }
}
