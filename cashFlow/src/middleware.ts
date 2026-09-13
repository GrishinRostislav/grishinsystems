import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const host = request.headers.get('host');
  if (host) {
    return `${forwardedProto}://${host}`;
  }
  return request.nextUrl.origin;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclude static files, login page, and auth api
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/cashFlow/_next') ||
    pathname.startsWith('/cashFlow/api/auth') ||
    pathname === '/login' ||
    pathname === '/cashFlow/login' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('auth');
  
  // If authenticated cookie is present, allow access
  if (authCookie && authCookie.value === 'authenticated') {
    return NextResponse.next();
  }

  // Otherwise check if auth is disabled in cookie/mode
  if (authCookie && authCookie.value === 'open') {
    return NextResponse.next();
  }

  if (pathname.includes('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const origin = getOrigin(request);
  return NextResponse.redirect(`${origin}/cashFlow/login`);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

