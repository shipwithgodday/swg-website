'use client';

import { SignedIn } from '@clerk/nextjs';
import DesktopNavItem from './DesktopNavItem';
import { navItems } from './navItems';

const Links: React.FC = () => (
  <div className="hidden items-center gap-8 md:flex">
    {navItems.map((item, index) => (
      <DesktopNavItem key={index} {...item} />
    ))}
    <SignedIn>
      <DesktopNavItem text="Orders" url="/shop/orders" />
    </SignedIn>
  </div>
);

export default Links;
