import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Static assets and internal Next.js requests bypass middleware
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Session validation via Supabase SSR
  const { user, response } = await updateSession(request);

  // Extract host subdomain (e.g. apex.recruitos.com)
  const host = request.headers.get('host') || hostname;
  const parts = host.split('.');
  let subdomain = 'apex';

  if (parts.length > 2 && !host.includes('localhost')) {
    subdomain = parts[0];
  }

  // Public auth routes
  const isAuthRoute = pathname === '/login' || pathname.startsWith('/portal/review');

  // Unauthenticated user attempting to access protected dashboard routes
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Authenticated user attempting to access login page -> redirect to cockpit
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/cockpit';
    return NextResponse.redirect(url);
  }

  // Inject tenant subdomain header into downstream server components
  response.headers.set('x-tenant-subdomain', subdomain);
  if (user) {
    const agencyId = user.user_metadata?.agency_id || 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
    response.headers.set('x-agency-id', agencyId);
    response.headers.set('x-user-id', user.id);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
