import { type Address, toHex } from 'viem';

export const SignMessageAction = ({
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
                  method: 'personal_sign',
                  params: [toHex(message), address],
                },
              },
            },
          }),
        ])
      }
      type="button"
    >
      Sign Message
    </button>
  );
};
