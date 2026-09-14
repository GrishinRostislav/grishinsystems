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

    let settings = await prisma.settings.findUnique({ where: { id: "global" } });
    
    // Priority:
    // 1. If settings.appPassword is set to a non-empty string, require that exact password.
    // 2. If settings exists and settings.appPassword === "" or null (explicit reset), password is disabled (allow any/blank).
    // 3. If settings is not created yet, allow blank/any password.
    let cleanExpected = "";
    if (settings && settings.appPassword) {
      cleanExpected = settings.appPassword.trim();
    }

    const cleanInput = (password || '').trim();

    // If cleanExpected is empty, authentication is disabled (always match)
    const isMatch = !cleanExpected || cleanInput === cleanExpected;

    if (isMatch) {
      // Clear all lockouts
      try {
        await prisma.loginAttempt.deleteMany();
      } catch (e) {}

      const response = NextResponse.json({ success: true });
      
      const isProd = process.env.NODE_ENV === 'production';

      // Set cookie via Next.js response.cookies API
      response.cookies.set({
        name: 'auth',
        value: 'authenticated',
        path: '/',
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      // Also append raw Set-Cookie headers for both root and /cashFlow basePath
      response.headers.append('Set-Cookie', `auth=authenticated; Path=/; HttpOnly; ${isProd ? 'Secure;' : ''} Max-Age=2592000; SameSite=Lax`);
      response.headers.append('Set-Cookie', `auth=authenticated; Path=/cashFlow; HttpOnly; ${isProd ? 'Secure;' : ''} Max-Age=2592000; SameSite=Lax`);

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
    return NextResponse.json({ 
      error: 'Authentication service temporarily unavailable'
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear the auth cookie on root path and basePath
    response.headers.append(
      'Set-Cookie',
      'auth=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
    );
    response.headers.append(
      'Set-Cookie',
      'auth=; Path=/cashFlow; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
    );
    
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: `Logout failed: ${error.message || error}` }, { status: 500 });
  }
}
