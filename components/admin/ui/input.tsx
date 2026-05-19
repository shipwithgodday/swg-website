import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({
  className,
  type,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-9 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-900 shadow-xs transition-colors outline-none',
        'placeholder:text-zinc-400',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-700',
        'focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/10',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
        className
      )}
      {...props}
    />
  );
}

export { Input };
