import type { Address } from 'viem';

export const MintPaidNFTAction = ({
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
                      data: '0xe95a71ae000000000000000000000000f2d70927368140d67355465c4e07d39cab36aec9',
                      from: address,
                      to: '0x1A88CEB0Ef27383f4FB85231765AB8Cf7B27B99C',
                      value: '0xde0b6b3a7640000',
                      eip712Meta: {
                        gasPerPubdata: '0xc350',
                        paymasterParams: {
                          paymaster:
                            '0x98546B226dbbA8230cf620635a1e4ab01F6A99B2',
                          paymasterInput: [
                            140, 90, 52, 69, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0, 0, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0,
                          ],
                        },
                      },
                      type: '0x71',
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
      Mint Paid NFT (With Paymaster)
    </button>
  );
};
