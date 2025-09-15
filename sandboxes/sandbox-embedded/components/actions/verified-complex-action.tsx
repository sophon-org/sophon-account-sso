import type { Address } from 'viem';

export const VerifiedComplexAction = ({
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
                      data: '0x5b4771e300000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000e616e6f7468657220737472696e670000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000b48656c6c6f20576f726c64000000000000000000000000000000000000000000',
                      from: address,
                      to: '0xC0830ABFe9Ab55b476456f7cA13103c666be5502',
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
      Verified contract (complex)
    </button>
  );
};
