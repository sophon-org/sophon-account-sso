import type { Address } from 'viem';

export const SendSophAction = ({
  sendMessage,
  address,
}: {
  sendMessage: (message: { action: string; payload: unknown }) => void;
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
                  method: 'eth_sendTransaction',
                  params: [
                    {
                      data: '0x',
                      from: address,
                      to: '0xC988e0b689898c3D1528182F6917b765aB6C469A',
                      value: '0x38d7ea4c68000',
                    },
                  ],
                },
              },
            },
          }),
        ])
      }
      type="button"
    >
      Send 0,001 SOPH
    </button>
  );
};
