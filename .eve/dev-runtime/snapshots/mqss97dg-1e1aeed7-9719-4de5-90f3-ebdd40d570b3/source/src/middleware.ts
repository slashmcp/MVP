import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // If no SITE_PIN is set, don't enforce gating
  if (!process.env.SITE_PIN) {
    return NextResponse.next();
  }

  // Allow access to the /pin page and static assets
  const path = request.nextUrl.pathname;
  if (
    path.startsWith('/pin') || 
    path.startsWith('/api/') || 
    path.startsWith('/_next/') || 
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('app-access-pin')?.value;
  
  if (authCookie !== process.env.SITE_PIN) {
    return NextResponse.redirect(new URL('/pin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
