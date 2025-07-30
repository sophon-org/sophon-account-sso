import { cn } from '@/lib/cn';

export const LegalNotice = ({ className }: { className?: string }) => {
  return (
    <div className={cn('text-sm text-black text-center', className)}>
      <div className="w-[312px] mx-auto">
        By logging in you are accepting our <br />{' '}
        <a
          className="underline underline-offset-2 text-blue-500"
          href="https://sophon.xyz/terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms of Use
        </a>{' '}
        and{' '}
        <a
          className="underline underline-offset-2 text-blue-500"
          href="https://sophon.xyz/privacypolicy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>
        .
      </div>
    </div>
  );
};
