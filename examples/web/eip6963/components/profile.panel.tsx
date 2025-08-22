import { shortenAddress } from '@sophon-labs/account-core';
import { useEffect } from 'react';
import { erc20Abi, formatUnits, parseUnits } from 'viem';
import { useAccount, useBalance, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { Loader } from './loader';
import NftPanel from './nft.panel';
import OtherPanel from './other.panel';
import { usePaymaster } from './paymaster.provider';
import SignaturesPanel from './signature.panel';
import TokenTransactionsPanel from './transaction-tokens.panel';
import { config } from './Web3Provider';

export const ProfilePanel = () => {
  const { isConnected, address } = useAccount();
  const { data: balance } = useBalance({
    address,
  });
  const { paymasterEnabled, setPaymasterEnabled } = usePaymaster();
  const {
    data: balanceMintMe,
    refetch: refetchMintMe,
    isRefetching: isRefetchingMintMe,
  } = useBalance({
    address,
    token: '0xE676a42fEd98d51336f02510bB5d598893AbfE90',
  });

  const { data: writeContractData, writeContract } = useWriteContract();

  const handleMint = () => {
    writeContract({
      address: '0xE676a42fEd98d51336f02510bB5d598893AbfE90', // MOCK MintMe token
      abi: [
        ...erc20Abi,
        {
          inputs: [
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
          ],
          name: 'mint',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      functionName: 'mint',
      args: [parseUnits('10', 18)],
    });
  };

  useEffect(() => {
    const refetch = async () => {
      if (writeContractData) {
        await waitForTransactionReceipt(config, {
          hash: writeContractData,
        });

        refetchMintMe({});
      }
    };
    refetch();
  }, [writeContractData]);

  if (!isConnected)
    return (
      <div className="flex justify-center items-center mt-4">
        <Loader />
      </div>
    );
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
        <p className="text-sm text-gray-500">
          <span className="font-bold">DTN Token (For test):</span>{' '}
          {balanceMintMe
            ? formatUnits(balanceMintMe.value, balanceMintMe.decimals)
            : '0'}{' '}
          <a
            className="cursor-pointer text-xs text-gray-500 underline"
            onClick={handleMint}
          >
            mint
          </a>
        </p>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          id="usePaymaster"
          className="rounded border-gray-300"
          checked={paymasterEnabled}
          onChange={(e) => setPaymasterEnabled(e.target.checked)}
        />
        <label htmlFor="usePaymaster" className="text-sm text-gray-500">
          Use paymaster (broken for now)
        </label>
      </div>
      <SignaturesPanel />
      <TokenTransactionsPanel />
      <NftPanel />
      <OtherPanel />
    </div>
  );
};
