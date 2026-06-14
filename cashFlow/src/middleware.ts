import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if there is an APP_PASSWORD configured. If not, bypass auth.
  if (!process.env.APP_PASSWORD) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  
  // Exclude static files, login page, and auth api
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('auth');
  
  if (!authCookie || authCookie.value !== 'authenticated') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

