import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-browser cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === '/login' || pathname.startsWith('/auth/callback') || pathname.startsWith('/api/auth');
  const isPinRoute = pathname === '/pin';
  const isApiRoute = pathname.startsWith('/api/') && !pathname.startsWith('/api/auth');

  // Layer 1: Must be logged in via OAuth
  if (!user && !isAuthRoute && !isPinRoute && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from /login to the pin page
  if (user && isAuthRoute && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/pin';
    return NextResponse.redirect(url);
  }

  // Layer 2: PIN gate — must have the correct PIN cookie
  const correctPin = process.env.NEXT_PUBLIC_APP_PIN;
  if (correctPin && user && !isAuthRoute && !isPinRoute && !isApiRoute) {
    const pinCookie = request.cookies.get('app-access-pin')?.value;
    if (pinCookie !== correctPin) {
      const url = request.nextUrl.clone();
      url.pathname = '/pin';
      return NextResponse.redirect(url);
    }
  }

  // If already pinned and verified, redirect away from /pin to the app
  if (isPinRoute && user) {
    const correctPin = process.env.NEXT_PUBLIC_APP_PIN;
    const pinCookie = request.cookies.get('app-access-pin')?.value;
    if (correctPin && pinCookie === correctPin) {
      const url = request.nextUrl.clone();
      url.pathname = '/candidates';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
