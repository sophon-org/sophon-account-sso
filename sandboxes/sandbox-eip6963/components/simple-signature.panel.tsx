import { useSignMessage } from 'wagmi';

export default function SimpleSignaturePanel() {
  const {
    isPending: isSigningMessage,
    signMessage,
    data: messageData,
    error: messageError,
  } = useSignMessage();

  const handleSignMessage = () => {
    signMessage({
      message: 'Hello from Sophon SSO!',
    });
  };

  return (
    <div className="flex flex-col gap-2 mt-4 w-full">
      <button
        className="bg-blue-400 text-white p-2 rounded-md hover:bg-blue-500 hover:cursor-pointer border-1 border-black/40 w-full"
        onClick={handleSignMessage}
        type="button"
      >
        ✍️ {isSigningMessage ? 'Signing...' : 'Sign Message'}
      </button>
      {messageError && (
        <p className="text-sm  bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
          {(messageError as { details?: string })?.details ??
            messageError?.message}
        </p>
      )}
      {messageData && <p className="text-sm text-gray-500">{messageData}</p>}
    </div>
  );
}
