import React, { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

function Container({ children, className = '' }: ContainerProps) {
  return (
    <div
      className={`max-w-screen-xl mx-auto px-8 xl:px-0 ${className}`}>
      {children}
    </div>
  );
}

export default Container;
