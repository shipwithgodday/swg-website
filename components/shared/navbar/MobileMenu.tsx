'use client';

import { motion } from 'framer-motion';
import useMeasure from 'react-use-measure';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs';
import MobileNavItem from './MobileNavItem';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { navItems } from './navItems';

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
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <Button onClick={handleButtonClick}>
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
              appearance={{ elements: { avatarBox: 'size-8' } }}
            />
          </SignedIn>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileMenu;
