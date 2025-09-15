import type { Address } from 'viem';

export const SignTypedAction = ({
  sendMessage,
  address,
  message,
}: {
  sendMessage: (message: { action: string; payload: unknown }) => void;
  message: string;
  address: Address;
}) => {
  return (
    <button
      className="bg-purple-500/30 text-black border border-purple-500/50 px-4 py-2 rounded-md hover:bg-purple-500/50 transition-all duration-300 hover:cursor-pointer w-full"
      onClick={() =>
        Promise.all([
          sendMessage({ action: 'openModal', payload: {} }),
          sendMessage({
            action: 'rpc',
            payload: {
              id: crypto.randomUUID(),
              content: {
                action: {
                  method: 'eth_signTypedData_v4',
                  params: [
                    address,
                    `{"domain":{"name":"Sophon SSO","version":"1","chainId":531050104},"message":{"content":"${message}","from":{"name":"Little Billy","address":"${address}"},"timestamp":1756984125},"primaryType":"Mail","types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"}],"Person":[{"name":"name","type":"string"},{"name":"address","type":"address"}],"Mail":[{"name":"content","type":"string"},{"name":"from","type":"Person"},{"name":"timestamp","type":"uint256"}]}}`,
                  ],
                },
              },
            },
          }),
        ])
      }
      type="button"
    >
      Sign Typed Data
    </button>
  );
};
