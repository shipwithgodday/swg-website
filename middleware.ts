import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// /api/send-bulk is admin-only — it's gated by the admin matcher below.
// (The page that calls it, /admin/emails, already requires admin role.)
const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/send-bulk']);

// NOTE: /shop/checkout, /shop/orders and /account are intentionally NOT
// gated here. Each page renders an in-page SignInCard (with Clerk's
// modal) for signed-out visitors, and sensitive server actions on those
// pages re-check auth themselves. This avoids the jarring redirect to
// the standalone /sign-in route mid-checkout.

export default clerkMiddleware(async (auth, request) => {
  if (isAdminRoute(request)) {
    const session = await auth();
    // API callers (e.g. /api/send-bulk) expect JSON. An HTML redirect would
    // make their fetch().json() blow up with "Invalid response from server",
    // so answer those with a JSON error instead of redirecting.
    const isApi = request.nextUrl.pathname.startsWith('/api');

    if (!session.userId) {
      return isApi
        ? NextResponse.json(
            { error: 'Authentication required.' },
            { status: 401 }
          )
        : NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const role = (session.sessionClaims as { metadata?: { role?: string } })
      ?.metadata?.role;
    if (role !== 'admin') {
      return isApi
        ? NextResponse.json(
            { error: 'Admin access required.' },
            { status: 403 }
          )
        : NextResponse.redirect(new URL('/', request.url));
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
