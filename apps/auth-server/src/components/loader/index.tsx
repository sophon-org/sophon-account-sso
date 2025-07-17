import { cn } from '@/lib/cn';

interface LoaderProps {
  className?: string;
}

export function Loader({ className = '' }: LoaderProps) {
  return (
    <div
      className={cn(
        'w-4 h-4 inline-block animate-spin rounded-full border-2 border-solid border-bright-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
        className,
      )}
    />
  );
}
