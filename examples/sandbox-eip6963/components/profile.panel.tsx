import { shortenAddress } from '@sophon-labs/account-core';
import { formatUnits } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import MintPanel from './mint.panel';
import SimpleSignaturePanel from './simple-signature.panel';
import TransactionERC20Panel from './transaction-erc20.panel';
import TransactionNativePanel from './transaction-native.panel';
import TypedSignaturePanel from './typed-signature.panel';

export const ProfilePanel = () => {
  const { isConnected, address } = useAccount();
  const { data: balance } = useBalance({
    address,
  });
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
    </div>
  );
};
