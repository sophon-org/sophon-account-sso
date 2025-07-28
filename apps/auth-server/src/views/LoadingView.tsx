import { Loader } from '@/components/loader';

export const LoadingView = ({ message }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-8 mt-6 flex-grow">
      <Loader className="h-10 w-10 animate-spin block border-black border-r-transparent" />
      <p className="ml-2 mt-2">{message ?? 'Loading...'}</p>
    </div>
  );
};
