'use client';
import { SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * A card prompting the visitor to sign in or create an account. Used on
 * checkout and the orders page when there is no authenticated Clerk user.
 */
export function SignInCard({
  title,
  description,
  redirectUrl,
}: {
  title: string;
  description: string;
  /** Where to send the visitor after they sign in. */
  redirectUrl?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white px-6 py-12 text-center shadow-sm">
      <span className="grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
        <LogIn className="size-5" />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <SignInButton
          mode="modal"
          forceRedirectUrl={redirectUrl}
          signUpForceRedirectUrl={redirectUrl}>
          <Button>Sign in</Button>
        </SignInButton>
        <Button asChild variant="outline">
          <Link
            href={`/sign-up${
              redirectUrl
                ? `?redirect_url=${encodeURIComponent(redirectUrl)}`
                : ''
            }`}>
            Create account
          </Link>
        </Button>
      </div>
    </div>
  );
}
