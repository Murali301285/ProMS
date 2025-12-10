
import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // 1. Check if trying to access protected routes
    if (pathname.startsWith('/dashboard')) {
        const token = request.cookies.get('auth_token');

        // 2. If no token, redirect to login page immediately
        if (!token) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // 3. Allow request to proceed
    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'], // Apply only to dashboard routes
};
