import { shortenAddress } from '@sophon-labs/account-core';
import { formatUnits } from 'viem';
import { useAccount, useBalance, useConfig } from 'wagmi';
import { disconnect } from 'wagmi/actions';
import MintPanel from './mint.panel';
import SimpleSignaturePanel from './simple-signature.panel';
import TransactionERC20Panel from './transaction-erc20.panel';
import TransactionNativePanel from './transaction-native.panel';
import TypedSignaturePanel from './typed-signature.panel';

export const ProfilePanel = () => {
  const wagmiConfig = useConfig();
  const { isConnected, address } = useAccount();
  const { data: balance } = useBalance({
    address,
  });
  const handleDisconnect = async () => {
    await disconnect(wagmiConfig);
  };
  if (!isConnected) return null;
  return (
    <div className="flex flex-col gap-1 mt-2  w-full">
      <div className="flex flex-col gap-2 border border-gray-300 rounded-md p-4">
        <p className="text-sm text-gray-500">
          <span className="font-bold">User:</span> {shortenAddress(address)}
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-bold">Soph:</span>{' '}
          {balance ? formatUnits(balance.value, balance.decimals) : '0'}
        </p>
      </div>
      <SimpleSignaturePanel />
      <TypedSignaturePanel />
      <TransactionNativePanel />
      <TransactionERC20Panel />
      <MintPanel />
      <button
        className="bg-red-500/30 text-black border border-red-500/50 px-4 py-2 rounded-md hover:bg-red-500/50 transition-all duration-300 hover:cursor-pointer"
        type="button"
        onClick={handleDisconnect}
      >
        Disconnect
      </button>
    </div>
  );
};
