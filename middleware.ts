import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/email', '/api/send-bulk']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isShopAuthRoute = createRouteMatcher([
  '/shop/checkout(.*)',
  '/shop/orders(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  if (isAdminRoute(request)) {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    const role = (session.sessionClaims as { metadata?: { role?: string } })
      ?.metadata?.role;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (isShopAuthRoute(request)) {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
