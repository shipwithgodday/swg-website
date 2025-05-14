'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { NavItem } from './navItems';

const DesktopNavItem: React.FC<NavItem> = ({
  text,
  url,
  subItems,
}) => {
  const pathname = usePathname();
  const isActive = pathname === url;

  return (
    <div className="relative group">
      {url ? (
        <Link
          href={url}
          className={`flex gap-1 items-center transition-transform hover:scale-105 active:scale-95 ${
            isActive ? 'border-b-2 border-black font-semibold' : ''
          }`}>
          <span className="text-black">{text}</span>
        </Link>
      ) : (
        <div className="flex gap-1 items-center cursor-pointer">
          <span className="text-black">{text}</span>
          {subItems && <ChevronDown className="w-4 h-4 text-black" />}
        </div>
      )}

      {subItems && (
        <div className="absolute left-0 top-full hidden group-hover:block bg-white shadow-lg rounded-md py-2 min-w-[200px] z-50">
          {subItems.map((item, index) => (
            <Link
              key={index}
              href={item.url || '#'}
              className="block px-4 py-2 hover:bg-gray-100 text-black">
              {item.text}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
export default DesktopNavItem;
