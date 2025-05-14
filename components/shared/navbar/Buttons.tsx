'use client';

import { Dispatch, SetStateAction } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';

const Buttons = ({
  menuOpen,
  setMenuOpen,
}: {
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
}) => (
  <div className="flex items-center gap-4">
    <div className="hidden md:block">
      <Button className="hover:scale-105 transition-all duration-300">
        <Link className="flex items-center gap-1" href={'/schedule'}>
          Schedule a Call
          <Icon name="ArrowRight" />
        </Link>
      </Button>
    </div>

    <button
      onClick={() => setMenuOpen((pv) => !pv)}
      className="ml-2 block scale-100 text-3xl text-black transition-all hover:scale-105 hover:text-black/70 active:scale-95 md:hidden">
      {menuOpen ? <FiX /> : <FiMenu />}
    </button>
  </div>
);

export default Buttons;
