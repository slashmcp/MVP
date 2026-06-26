import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/candidates';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Auto-assign them to default org if they don't have one
      // (This could be handled via a trigger in Supabase, but we can also handle it simply here
      // if we had the service role key. Since we don't, we assume the user will configure the DB 
      // trigger or we run an RPC. Actually, we'll let the user run a trigger eventually).
      
      // Redirect to client page that sets the PIN cookie from sessionStorage
      return NextResponse.redirect(new URL('/auth/set-pin', request.url));
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/login?error=true', request.url));
}
