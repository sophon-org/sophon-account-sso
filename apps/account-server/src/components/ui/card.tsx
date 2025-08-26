import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  elevated?: boolean;
  small?: boolean;
}

export function Card({
  children,
  elevated = false,
  className,
  small = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        ' bg-white',
        elevated &&
          'shadow-[0_0_0_1px_rgba(15,14,13,0.04),0_2px_24px_0_rgba(15,14,13,0.04),0_12px_36px_0_rgba(15,14,13,0.04)]',
        small ? 'rounded-[8px]' : 'rounded-[24px]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
