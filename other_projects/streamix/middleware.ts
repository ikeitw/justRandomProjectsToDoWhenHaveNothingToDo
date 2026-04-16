import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/jwt';

// Routes that require authentication
const PROTECTED_PATHS = ['/browse', '/watch'];
// Routes accessible only when NOT authenticated
const AUTH_PATHS = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('streamix-token')?.value;

  // Check if current path requires authentication
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Protect private routes - redirect to login if no valid token
  if (isProtected) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
    const payload = await verifyToken(token);
    if (!payload) {
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.delete('streamix-token');
      return res;
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuth && token) {
    const payload = await verifyToken(token);
    if (payload) return NextResponse.redirect(new URL('/browse', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/browse/:path*', '/watch/:path*', '/login', '/register'],
};
