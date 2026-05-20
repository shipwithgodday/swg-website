import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/email', '/api/send-bulk']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

// NOTE: /shop/checkout, /shop/orders and /account are intentionally NOT
// gated here. Each page renders an in-page SignInCard (with Clerk's
// modal) for signed-out visitors, and sensitive server actions on those
// pages re-check auth themselves. This avoids the jarring redirect to
// the standalone /sign-in route mid-checkout.

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
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
