import { useSophonAccount } from '@sophon-labs/account-react';

export const ConnectButton = () => {
  const { connect } = useSophonAccount();
  const handleConnect = async () => {
    await connect();
  };

  return (
    <button
      className="bg-green-500/30 text-black border border-green-500/50 px-4 py-2 rounded-md hover:bg-green-500/50 transition-all duration-300 hover:cursor-pointer"
      type="button"
      onClick={handleConnect}
    >
      Connect With Sophon
    </button>
  );
};
