import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

interface ClaimsLike {
  metadata?: { role?: string };
}

/** Pure predicate: does the given session-claims object grant admin? */
export function hasAdminRole(claims: ClaimsLike | null | undefined): boolean {
  return claims?.metadata?.role === 'admin';
}

/** Server helper: true if the current request is an admin. */
export async function isAdmin(): Promise<boolean> {
  const { sessionClaims } = await auth();
  return hasAdminRole(sessionClaims as ClaimsLike | null);
}

/** Server helper: redirects non-admins away. Use in admin layouts/pages. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/');
}
