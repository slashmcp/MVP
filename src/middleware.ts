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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === '/login' || pathname.startsWith('/auth/callback') || pathname.startsWith('/api/auth');
  const isPinRoute = pathname === '/pin';
  const isApiRoute = pathname.startsWith('/api/') && !pathname.startsWith('/api/auth');

  // Unauthenticated users: allow through everywhere (they'll see demo data)
  // Exception: redirect them away from /pin since that's only for logged-in users
  if (!user && isPinRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from /login
  if (user && isAuthRoute && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/pin';
    return NextResponse.redirect(url);
  }

  // Layer 2: PIN gate — logged-in users must have the correct PIN cookie
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
