import { IconOffline } from '../icons/icon-offline';

export const OfflineContent = () => {
  return (
    <div className="flex flex-col justify-center text-center items-center">
      <IconOffline className="mt-4" />
      <h1 className="font-bold text-lg mt-4">You are offline!</h1>
      <h2 className="text-xs text-gray-700">Please try again later.</h2>
    </div>
  );
};
