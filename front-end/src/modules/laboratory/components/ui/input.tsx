import * as React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-2 text-lg text-[var(--text-main)] transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] focus:outline-none',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';
