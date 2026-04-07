import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value)
            );
          }
        },
      },
    }
  );

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'];
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return supabaseResponse;
  }

  const path = request.nextUrl.pathname;

  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    return NextResponse.redirect(url);
  };

  async function profileRole(): Promise<string | undefined> {
    if (!user) return undefined;
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    return data?.role as string | undefined;
  }

  // Unified login: skip if not authenticated
  if (path === '/login') {
    if (user) {
      const role = await profileRole();
      if (role === 'restaurant') return redirectTo('/dashboard/restaurant');
      if (role === 'farm') return redirectTo('/dashboard/farm');
      return redirectTo('/admin');
    }
    return supabaseResponse;
  }

  // Full public application: not available while signed in as farm/restaurant (use dashboard instead)
  if (path === '/apply' || path.startsWith('/apply/')) {
    if (user) {
      const role = await profileRole();
      if (role === 'farm') return redirectTo('/dashboard/farm');
      if (role === 'restaurant') return redirectTo('/dashboard/restaurant/add-dishes');
      if (role === 'admin') return redirectTo('/admin');
    }
    return supabaseResponse;
  }

  // Role-specific dashboards
  if (path.startsWith('/dashboard')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', path);
      return NextResponse.redirect(url);
    }
    const role = await profileRole();
    if (role === 'admin' || !role) {
      return redirectTo('/admin');
    }
    if (path.startsWith('/dashboard/restaurant') && role !== 'restaurant') {
      if (role === 'farm') return redirectTo('/dashboard/farm');
      return redirectTo('/admin');
    }
    if (path.startsWith('/dashboard/farm') && role !== 'farm') {
      if (role === 'restaurant') return redirectTo('/dashboard/restaurant');
      return redirectTo('/admin');
    }
    return supabaseResponse;
  }

  // Admin (legacy /admin/login included)
  if (path.startsWith('/admin')) {
    if (!path.startsWith('/admin/login') && !user) {
      return redirectTo('/admin/login');
    }
    if (path.startsWith('/admin/login') && user) {
      const role = await profileRole();
      if (role === 'restaurant') return redirectTo('/dashboard/restaurant');
      if (role === 'farm') return redirectTo('/dashboard/farm');
      return redirectTo('/admin');
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login', '/apply', '/apply/:path*'],
};
