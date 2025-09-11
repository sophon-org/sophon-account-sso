import type { Address } from 'viem';

export const UnverifiedAction = ({
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
                      data: '0x1123824e000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000008616e797468696e67000000000000000000000000000000000000000000000000',
                      from: address,
                      to: '0x0c76828A43556cAA48Fa687e540E6a76155d6850',
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
      Unverified contract
    </button>
  );
};
