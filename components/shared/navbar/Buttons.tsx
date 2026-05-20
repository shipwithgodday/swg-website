'use client';

import { Dispatch, SetStateAction } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { CartLink } from './CartLink';

const Buttons = ({
  menuOpen,
  setMenuOpen,
}: {
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
}) => (
  <div className="flex items-center gap-4">
    <CartLink />

    <div className="hidden md:block">
      <SignedOut>
        <SignInButton mode="modal">
          <Button className="hover:scale-105 transition-all duration-300">
            <span className="flex items-center gap-1">
              Sign in
              <Icon name="ArrowRight" />
            </span>
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton
          afterSignOutUrl="/"
          appearance={{ elements: { avatarBox: 'size-9' } }}
        />
      </SignedIn>
    </div>

    <button
      onClick={() => setMenuOpen((pv) => !pv)}
      className="ml-2 block scale-100 text-3xl text-black transition-all hover:scale-105 hover:text-black/70 active:scale-95 md:hidden">
      {menuOpen ? <FiX /> : <FiMenu />}
    </button>
  </div>
);

export default Buttons;
