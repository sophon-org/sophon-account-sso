import { useState } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { sophonTestnet } from 'wagmi/chains';

const EXAMPLE_PAYLOAD = (address: `0x${string}`) => ({
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
    from: address,
    timestamp: Math.floor(Date.now() / 1000),
  },
});

export default function TestTypedSignaturePanel() {
  const { address } = useAccount();
  const [payload, setPayload] = useState(
    EXAMPLE_PAYLOAD(address as `0x${string}`),
  );
  const {
    data: signTypedDataData,
    error: signTypedDataErrorWagmi,
    isPending: isSigningTypedData,
    signTypedData,
  } = useSignTypedData();

  const handleSignTypedData = () => {
    signTypedData(JSON.parse(JSON.stringify(payload)));
  };

  return (
    <fieldset className="flex flex-col w-full mt-4">
      <legend className="text-sm text-gray-500">useSignTypedData</legend>
      <div className="flex flex-col gap-2 mt-4 w-full">
        <textarea
          className="border border-gray-300 rounded-md p-2 flex-grow"
          value={JSON.stringify(payload, null, 2)}
          onChange={(e) => setPayload(JSON.parse(e.target.value))}
        />
        <button
          className="bg-orange-400 text-white p-2 rounded-md w-full hover:bg-orange-500 hover:cursor-pointer border-1 border-black/40"
          onClick={handleSignTypedData}
          type="button"
        >
          ✍️ {isSigningTypedData ? 'Signing...' : 'Sign Typed Data'}
        </button>
        {signTypedDataErrorWagmi && (
          <p className="text-sm  bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
            {(signTypedDataErrorWagmi as { details?: string })?.details ??
              signTypedDataErrorWagmi?.message}
          </p>
        )}
        {signTypedDataData && (
          <p className="text-sm text-gray-500">{signTypedDataData}</p>
        )}
      </div>
    </fieldset>
  );
}
