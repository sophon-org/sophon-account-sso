'use client';

import { ConnectKitButton, useModal } from 'connectkit';
import { parseEther } from 'viem';
import { sophonTestnet } from 'viem/chains';
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
} from 'wagmi';

export default function Home() {
  const { setOpen } = useModal();
  const { isConnected, address } = useAccount();

  const {
    data: signMessageData,
    error: signErrorWagmi,
    signMessage,
  } = useSignMessage();
  const {
    data: transactionData,
    error: txErrorWagmi,
    sendTransaction,
  } = useSendTransaction();
  const {
    data: signTypedDataData,
    error: signTypedDataErrorWagmi,
    signTypedData,
  } = useSignTypedData();
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
          onClick={() =>
            sendTransaction({
              to: '0x123',
              value: parseEther('0.001'),
              data: '0x',
            })
          }
          type="button"
        >
          Send Transaction
        </button>
        <p className="text-sm text-gray-500">{txErrorWagmi?.message}</p>
        <p className="text-sm text-gray-500">{transactionData}</p>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <button
          className="bg-blue-500 text-white p-2 rounded-md w-80"
          onClick={() =>
            signMessage({
              message: 'Hello, world!',
            })
          }
          type="button"
        >
          Sign Message
        </button>
        <p className="text-sm text-gray-500">{signErrorWagmi?.message}</p>
        <p className="text-sm text-gray-500">{signMessageData}</p>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <button
          className="bg-blue-500 text-white p-2 rounded-md w-80"
          onClick={() =>
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
            })
          }
          type="button"
        >
          Sign Typed Data
        </button>
        <p className="text-sm text-gray-500">
          {signTypedDataErrorWagmi?.message}
        </p>
        {signTypedDataData && (
          <p className="text-sm text-gray-500">{signTypedDataData}</p>
        )}
      </div>
    </div>
  );
}
