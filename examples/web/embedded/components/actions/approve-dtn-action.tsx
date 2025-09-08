import type { Address } from 'viem';

export const ApproveDTNAction = ({
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
                      data: '0x095ea7b3000000000000000000000000c988e0b689898c3d1528182f6917b765ab6c469a00000000000000000000000000000000000000000000000000038d7ea4c68000',
                      from: address,
                      to: '0xE676a42fEd98d51336f02510bB5d598893AbfE90',
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
      Approve 0,001 DTN
    </button>
  );
};
