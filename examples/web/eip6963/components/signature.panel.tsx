import { useEffect, useState } from 'react';
import { hashMessage, hashTypedData } from 'viem';
import { sophonTestnet } from 'viem/chains';
import { useAccount, useSignMessage, useSignTypedData } from 'wagmi';
import { validateSignature } from '../utils/signatures';

export default function SignaturePanel() {
  const { address } = useAccount();

  const [signinType, setSigninType] = useState<'message' | 'typed-data' | null>(
    null,
  );

  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());

  const MESSAGE_TO_SIGN = 'Hello from Sophon SSO!';
  const TYPED_DATA_TO_SIGN = (address: `0x${string}`, timestamp: number) => {
    return {
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
        timestamp: timestamp,
      },
    };
  };

  const {
    isPending: isSigningMessage,
    signMessage,
    data: messageData,
    error: messageError,
  } = useSignMessage();

  const handleSignMessage = () => {
    signMessage({
      message: MESSAGE_TO_SIGN,
    });
  };

  const {
    data: signTypedDataData,
    error: signTypedDataErrorWagmi,
    isPending: isSigningTypedData,
    signTypedData,
  } = useSignTypedData();

  const handleSignTypedData = () => {
    const timestamp = Math.floor(Date.now() / 1000);
    signTypedData(TYPED_DATA_TO_SIGN(address!, timestamp));
    setTimestamp(timestamp);
  };

  useEffect(() => {
    console.log('signTypedDataData', signTypedDataData);
    console.log('messageData', messageData);
    setIsValid(null);
    if (isSigningTypedData) {
      setSigninType('typed-data');
    } else if (isSigningMessage) {
      setSigninType('message');
    }
  }, [isSigningTypedData, isSigningMessage]);

  const handleValidateSignature = async () => {
    setIsValidating(true);
    if (signinType === 'typed-data') {
      const messageHash = hashTypedData(
        TYPED_DATA_TO_SIGN(address!, timestamp),
      );
      const isValidSignature = await validateSignature(
        messageHash,
        signTypedDataData!,
        address!,
      );
      setIsValid(isValidSignature);
    } else if (signinType === 'message') {
      const messageHash = hashMessage(MESSAGE_TO_SIGN as string);
      const isValidSignature = await validateSignature(
        messageHash,
        messageData!,
        address!,
      );
      setIsValid(isValidSignature);
    }
    setIsValidating(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mt-4">Signatures</h2>
      <div className="flex flex-row gap-2 mt-4 w-full">
        <button
          className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
          onClick={handleSignMessage}
          type="button"
        >
          ✍️ {isSigningMessage ? 'Signing...' : 'Sign Message'}
        </button>
        <button
          className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
          onClick={handleSignTypedData}
          type="button"
        >
          ✍️ {isSigningTypedData ? 'Signing...' : 'Sign Typed Data'}
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-4 w-full">
        {signinType === 'typed-data' && signTypedDataErrorWagmi && (
          <p className="text-sm  bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
            {(signTypedDataErrorWagmi as { details?: string })?.details ??
              signTypedDataErrorWagmi?.message}
          </p>
        )}
        {signinType === 'message' && messageError && (
          <p className="text-sm  bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
            {(messageError as { details?: string })?.details ??
              messageError?.message}
          </p>
        )}
        {signinType &&
          ((signinType === 'typed-data' && signTypedDataData !== undefined) ||
            (signinType === 'message' && messageData !== undefined)) && (
            <>
              <p className="text-sm bg-yellow-400/10 p-2 rounded-md border border-yellow-400 text-yellow-400 break-all">
                {signinType === 'typed-data' ? signTypedDataData : messageData}
              </p>
              <button
                className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
                onClick={handleValidateSignature}
                disabled={isValidating}
              >
                ✅{isValidating ? ' Validating...' : ' Validate Signature'}
              </button>
              {isValid !== null && isValid && (
                <p className="text-sm bg-green-400/10 p-2 rounded-md border border-green-400 text-green-400 text-center">
                  Signature is valid
                </p>
              )}
              {isValid !== null && !isValid && (
                <p className="text-sm bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
                  Signature is invalid
                </p>
              )}
            </>
          )}
      </div>
    </div>
  );
}
