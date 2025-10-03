import { shortenAddress } from '@sophon-labs/account-core';
import { useSophonAccount, useSophonConsent } from '@sophon-labs/account-react';
import { formatUnits } from 'viem';
import { useBalance } from 'wagmi';
import MintPanel from './mint.panel';
import SimpleSignaturePanel from './simple-signature.panel';
import TransactionERC20Panel from './transaction-erc20.panel';
import TransactionNativePanel from './transaction-native.panel';
import TypedSignaturePanel from './typed-signature.panel';

export const ProfilePanel = () => {
  const { isConnected, account, disconnect } = useSophonAccount();
  const { requestConsent } = useSophonConsent();
  const { data: balance } = useBalance({
    address: account.address,
  });
  const handleDisconnect = async () => {
    await disconnect();
  };
  if (!isConnected) return null;
  return (
    <div className="flex flex-col gap-1 mt-2  w-full">
      <div className="flex flex-col gap-2 border border-gray-300 rounded-md p-4">
        <p className="text-sm text-gray-500">
          <span className="font-bold">User:</span>{' '}
          {shortenAddress(account.address)}
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
        className="bg-blue-500/30 text-black border border-blue-500/50 px-4 py-2 rounded-md hover:bg-blue-500/50 transition-all duration-300 hover:cursor-pointer"
        type="button"
        onClick={() => requestConsent({ action: 'mint', params: [] })}
      >
        Request Consent
      </button>
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
