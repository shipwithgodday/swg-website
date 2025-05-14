'use client';

import { motion } from 'framer-motion';
import useMeasure from 'react-use-measure';
import MobileNavItem from './MobileNavItem';
import { Button } from '@/components/ui/button';
import { navItems } from './navItems';
import Link from 'next/link';

interface MobileMenuProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  menuOpen,
  setMenuOpen,
}) => {
  const [ref, { height }] = useMeasure();

  const handleButtonClick = () => {
    setMenuOpen(false);
  };

  return (
    <motion.div
      initial={false}
      animate={{ height: menuOpen ? height : '0px' }}
      className="block overflow-hidden lg:hidden">
      <div
        ref={ref}
        className="flex flex-col items-start gap-2 px-8 pb-4">
        {navItems.map((item, index) => (
          <MobileNavItem
            key={index}
            {...item}
            setMenuOpen={setMenuOpen}
          />
        ))}
        <div className="mt-2">
          <Button onClick={handleButtonClick}>
            <Link href={'/contact'}>Contact Us</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileMenu;
