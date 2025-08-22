import { useAccount, useSignTypedData } from 'wagmi';
import { sophonTestnet } from 'wagmi/chains';

export default function TypedSignaturePanel() {
  const { address } = useAccount();
  const {
    data: signTypedDataData,
    error: signTypedDataErrorWagmi,
    isPending: isSigningTypedData,
    signTypedData,
  } = useSignTypedData();

  const handleSignTypedData = () => {
    signTypedData({
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
        from: address as `0x${string}`,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
      },
    });
  };

  return (
    <div className="flex flex-col gap-2 mt-4 w-full">
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
  );
}
