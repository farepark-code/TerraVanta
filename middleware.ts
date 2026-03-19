import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Basic session cookie check for middleware routing.
  // In a full implementation, you'd decode the JWT or rely on a session cookie set via an API.
  const sessionCookie = request.cookies.get('session');
  
  // Note: These values should be extracted from the valid token/session.
  // We mock the extraction here for the structural outline.
  let role: string | null = null;
  let isSuperAdmin = false;
  let isAuthenticated = !!sessionCookie;

  if (isAuthenticated && sessionCookie?.value) {
    try {
      // Very basic structural parsing (In reality, verify JWT with `jose`)
      const encodedPayload = sessionCookie.value.split('.')[1];
      if (encodedPayload) {
        const payload = JSON.parse(atob(encodedPayload));
        role = payload.role || null;
        isSuperAdmin = !!payload.isSuperAdmin;
      }
    } catch (e) {
      // invalid token placeholder
    }
  }

  // /(auth)/* -> redirect to dashboard if logged in
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (isAuthenticated) {
      if (role === 'consultant' || role === 'consultant_member') {
        return NextResponse.redirect(new URL('/consultant/dashboard', request.url));
      }
      if (role === 'client_user') {
        return NextResponse.redirect(new URL('/client/portal', request.url));
      }
      if (isSuperAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      // default fallback
      return NextResponse.redirect(new URL('/consultant/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Route protections
  if (pathname.startsWith('/consultant')) {
    if (!isAuthenticated || (role !== 'consultant' && role !== 'consultant_member')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname.startsWith('/client/portal')) {
    if (!isAuthenticated || role !== 'client_user') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated || !isSuperAdmin) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/consultant/:path*',
    '/client/portal/:path*',
    '/admin/:path*',
    '/login',
    '/register'
  ],
};
