'use client';

import Image from 'next/image';
import logo from '@/public/logo.svg';
import Link from 'next/link';

const Logo = () => (
  <div className="w-24">
    <Link href={'/'}>
      <Image
        src={logo}
        width={484}
        height={137}
        alt="Ship With Godday - Your Trusted Shipping Partner"
        priority
      />
    </Link>
  </div>
);

export default Logo;
