'use client';

import { ConnectKitButton, useModal } from 'connectkit';
import { erc20Abi, parseEther, parseUnits } from 'viem';
import { sophonTestnet } from 'viem/chains';
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useWriteContract,
} from 'wagmi';

type WriteContractResponse = {
  id: string;
  requestId: string;
  content: {
    result: `0x${string}`;
  };
};

export default function Home() {
  const { setOpen } = useModal();
  const { isConnected, address } = useAccount();
  const {
    data: transactionData,
    error: txErrorWagmi,
    sendTransaction,
    isPending: isSendingSoph,
  } = useSendTransaction();
  const {
    isPending: isSigningMessage,
    signMessage,
    data: messageData,
    error: messageError,
  } = useSignMessage();
  const {
    data: signTypedDataData,
    error: signTypedDataErrorWagmi,
    isPending: isSigningTypedData,
    signTypedData,
  } = useSignTypedData();
  const {
    data: writeContractData,
    error: writeContractErrorWagmi,
    writeContract,
    isPending: isSendingERC20,
  } = useWriteContract();

  const typedWriteContractData = writeContractData as
    | WriteContractResponse
    | undefined;

  const handleSignMessage = () => {
    signMessage({
      message: 'Hello from Sophon SSO!',
    });
  };

  const handleSignTypedData = () => {
    signTypedData({
      domain: {
        name: 'Sophon SSO',
        version: '1',
        chainId: sophonTestnet.id,
      },
      types: {
        Message: [
          { name: 'content', type: 'string' },
          { name: 'from', type: 'address' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
      primaryType: 'Message',
      message: {
        content: `Hello from Sophon SSO!\n\nThis message confirms you control this wallet.`,
        from: address as `0x${string}`,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
      },
    });
  };

  const handleSendSoph = () => {
    sendTransaction({
      to: '0x0d94c4DBE58f6FE1566A7302b4E4C3cD03744626',
      value: parseEther('0.001'),
      data: '0x',
    });
  };

  const handleERC20Transfer = () => {
    writeContract({
      address: '0xE70a7d8563074D6510F550Ba547874C3C2a6F81F', // MOCK DAI contract
      abi: erc20Abi,
      functionName: 'transfer',
      args: [
        '0x0d94c4DBE58f6FE1566A7302b4E4C3cD03744626' as `0x${string}`,
        parseUnits('1', 18),
      ],
    });
  };

  /* const mint = () => {
    writeContract({
      address: '0xbc812793ddc7570b96A5b0A520eB0A6c07c06a6a', // MOCK NFT contract
      abi: nftAbi,
      functionName: 'claim',
      args: [0o000],
    });
  }; */

  return (
    <div>
      <ConnectKitButton />
      <button onClick={() => setOpen(true)} type="button">
        Open
      </button>
      <p className="text-sm text-gray-500">
        {isConnected ? 'Connected' : 'Not connected'}
      </p>
      <p className="text-sm text-gray-500">{address}</p>
      <div className="flex flex-col gap-2 mt-4">
        <button
          className="bg-blue-500 text-white p-2 rounded-md w-80"
          onClick={handleSendSoph}
          type="button"
        >
          {isSendingSoph ? 'Sending...' : 'Send SOPH'}
        </button>
        <p className="text-sm text-gray-500">{txErrorWagmi?.message}</p>
        <p className="text-sm text-gray-500">{transactionData}</p>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <button
          className="bg-blue-500 text-white p-2 rounded-md w-80"
          onClick={handleERC20Transfer}
          type="button"
        >
          {isSendingERC20 ? 'Sending...' : 'Send ERC20'}
        </button>
        <p className="text-sm text-gray-500">
          {writeContractErrorWagmi?.message}
        </p>
        {writeContractData && (
          <p className="text-sm text-gray-500">
            Transaction Hash: {typedWriteContractData?.content?.result}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <button
          className="bg-blue-500 text-white p-2 rounded-md w-80"
          onClick={handleSignTypedData}
          type="button"
        >
          {isSigningTypedData ? 'Signing...' : 'Sign Typed Data'}
        </button>
        <p className="text-sm text-gray-500">
          {signTypedDataErrorWagmi?.message}
        </p>
        {signTypedDataData && (
          <p className="text-sm text-gray-500">{signTypedDataData}</p>
        )}
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <button
          className="bg-blue-500 text-white p-2 rounded-md w-80"
          onClick={handleSignMessage}
          type="button"
        >
          {isSigningMessage ? 'Signing...' : 'Sign Message'}
        </button>
        <p className="text-sm text-gray-500">{messageError?.message}</p>
        {messageData && <p className="text-sm text-gray-500">{messageData}</p>}
      </div>
    </div>
  );
}
