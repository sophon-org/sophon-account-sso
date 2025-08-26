import { useState } from 'react';
import { useSignMessage } from 'wagmi';

export default function TestUseSignMessagePanel() {
  const [message, setMessage] = useState('Hello from Sophon SSO!');
  const {
    isPending,
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
    <fieldset className="flex flex-col w-full mt-4">
      <legend className="text-sm text-gray-500">useSignMessage</legend>
      <div className="flex flex-row gap-2 w-full">
        <input
          data-testid="use-sign-message-input"
          type="text"
          className="border border-gray-300 rounded-md p-2 flex-grow"
          placeholder="Message to sign"
          onChange={(e) => setMessage(e.target.value)}
          value={message}
        />
        <button
          data-testid="use-sign-message-button"
          className="bg-blue-400 text-white p-2 rounded-md hover:bg-blue-500 hover:cursor-pointer border-1 border-black/40 w-10"
          onClick={handleSignMessage}
          type="button"
        >
          {isPending ? '⏳' : '▶️'}
        </button>
      </div>
      {messageError && (
        <p
          data-testid="use-sign-message-error"
          className="text-sm text-red-500 wrap-anywhere mt-4"
        >
          {(messageError as { details?: string })?.details ??
            messageError?.message}
        </p>
      )}
      {messageData && (
        <p
          data-testid="use-sign-message-result"
          className="text-sm text-green-500 wrap-anywhere mt-4"
        >
          <pre className="text-wrap">{JSON.stringify(messageData)}</pre>
        </p>
      )}
    </fieldset>
  );
}
