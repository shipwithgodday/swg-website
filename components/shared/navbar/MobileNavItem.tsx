'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { NavItem } from './navItems';

interface MobileNavItemProps extends NavItem {
  setMenuOpen: (open: boolean) => void;
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({
  text,
  url,
  subItems,
  setMenuOpen,
}) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (url) {
      // Close the menu when a link is clicked
      setMenuOpen(false);
    } else if (subItems) {
      // Toggle dropdown if it has subitems
      setOpen(!open);
    }
  };

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-100 rounded">
        {url ? (
          <Link href={url} className="text-black w-full block">
            {text}
          </Link>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-black">{text}</span>
            {subItems && (
              <ChevronDown
                className={`w-4 h-4 text-black transition-transform ${
                  open ? 'rotate-180' : ''
                }`}
              />
            )}
          </div>
        )}
      </div>

      {subItems && open && (
        <div className="pl-4">
          {subItems.map((item, index) => (
            <Link
              key={index}
              href={item.url || '#'}
              className="block p-2 text-black hover:bg-gray-100 rounded"
              onClick={() => setMenuOpen(false)}>
              {item.text}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileNavItem;
