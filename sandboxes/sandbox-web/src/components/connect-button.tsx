import { useSophonAccount } from '@sophon-labs/account-react';

export const ConnectButton = () => {
  const { connect } = useSophonAccount();

  const handleConnect = async () => {
    console.log('Connecting to Sophon');
    await connect();
    console.log('Connected to Sophon');
  };

  return (
    <button
      type="button"
      onClick={handleConnect}
      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 hover:cursor-pointer"
    >
      Connect with Sophon
    </button>
  );
};
