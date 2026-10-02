import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Check if the path is trying to access the admin section
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Exclude the login page itself to prevent infinite loops
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Check for the admin session cookie
    const hasAdminSession = request.cookies.has('3wm_admin_session');

    if (!hasAdminSession) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
