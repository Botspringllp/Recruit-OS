import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { TESTING_MODE } from '@/lib/config';

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Static assets, internal Next.js requests, and prefetch calls bypass heavy middleware checks
  const isPrefetch = request.headers.get('next-router-prefetch') || request.headers.get('purpose') === 'prefetch';

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    isPrefetch
  ) {
    return NextResponse.next();
  }

  // Session validation via HTTP-only session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  const response = NextResponse.next();

  // Extract host subdomain (e.g. apex.recruitos.com)
  const host = request.headers.get('host') || hostname;
  const parts = host.split('.');
  let subdomain = 'apex';

  if (parts.length > 2 && !host.includes('localhost')) {
    subdomain = parts[0];
  }

  // Route definitions
  const isLoginRoute = pathname === '/login';
  const isSplashRoute = pathname === '/';
  const isPublicRoute = isLoginRoute || isSplashRoute || pathname.startsWith('/portal/review') || pathname.startsWith('/client-review');

  // =========================================================================
  // TESTING MODE AUTHENTICATION BEHAVIOR (TESTING_MODE = true)
  // =========================================================================
  if (TESTING_MODE) {
    // 1. Allow Splash route (/) to render without interception
    if (isSplashRoute) {
      return response;
    }

    // 2. Always allow Login route (/login) to render
    if (isLoginRoute) {
      return response;
    }

    // 3. Unauthenticated requests to protected routes redirect to Login route (/login)
    if (!session && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Inject tenant headers for authenticated sessions
    response.headers.set('x-tenant-subdomain', subdomain);
    if (session) {
      response.headers.set('x-agency-id', session.agencyId || '');
      response.headers.set('x-user-id', session.userId);
    }

    return response;
  }

  // =========================================================================
  // PRODUCTION MODE AUTHENTICATION BEHAVIOR (TESTING_MODE = false)
  // =========================================================================
  // Unauthenticated user attempting to access protected dashboard routes
  if (!session && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Authenticated user attempting to access login page directly -> redirect
  if (session && isLoginRoute) {
    const url = request.nextUrl.clone();
    const roleUpper = String(session.role || '').toUpperCase();
    if (roleUpper === 'SUPER_ADMIN' || roleUpper === 'MASTER_OWNER') {
      url.pathname = '/super-admin';
    } else if (roleUpper === 'FINANCE_MANAGER') {
      url.pathname = '/finance';
    } else if (roleUpper === 'COMPLIANCE_OFFICER') {
      url.pathname = '/compliance';
    } else if (roleUpper === 'INTERVIEW_COORDINATOR') {
      url.pathname = '/interviews';
    } else {
      url.pathname = '/cockpit';
    }
    return NextResponse.redirect(url);
  }

  // Inject tenant subdomain header into downstream server components
  response.headers.set('x-tenant-subdomain', subdomain);
  if (session) {
    response.headers.set('x-agency-id', session.agencyId || '');
    response.headers.set('x-user-id', session.userId);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
