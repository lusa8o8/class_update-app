import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'catch-up-certainty-secret-key'
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Public paths
  if (pathname === '/login' || pathname === '/waitlist' || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    if (pathname === '/') {
      return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/student', request.url));
    }
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/student', request.url));
    }

    if (pathname.startsWith('/student') && role !== 'student') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*', '/'],
};
