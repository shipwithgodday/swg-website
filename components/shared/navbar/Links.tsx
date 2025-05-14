'use client';

import DesktopNavItem from './DesktopNavItem';
import { navItems } from './navItems';

const Links: React.FC = () => (
  <div className="hidden items-center gap-8 md:flex">
    {navItems.map((item, index) => (
      <DesktopNavItem key={index} {...item} />
    ))}
  </div>
);

export default Links;
