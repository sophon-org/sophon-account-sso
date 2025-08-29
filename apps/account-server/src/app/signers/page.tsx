'use client';

import { shortenAddress } from '@sophon-labs/account-core';
import { useEffect, useState } from 'react';
import { hashMessage, hashTypedData } from 'viem';
import { sophonTestnet } from 'viem/chains';
import {
  hashTypedData as hash7339,
  wrapTypedDataSignature,
} from 'viem/experimental/erc7739';
import { Dialog } from '@/components/dialog';
import { Button } from '@/components/ui/button';
import { useAccountContext } from '@/hooks/useAccountContext';
import { usePasskeyRegistration } from '@/hooks/usePasskeyRegistration';
import { useRequestDrawer } from '@/hooks/useRequestDrawer';
import { useSignature } from '@/hooks/useSignature';
import { useTransaction } from '@/hooks/useTransaction';
import { validateSmartAccountSignature } from '@/lib/signers';
import type { EnrichedTransactionRequest } from '@/types/auth';
import {
  AccountType,
  type k1Signer,
  type PasskeySigner,
} from '@/types/smart-account';
import TransactionRequestView, {
  BaseTransactionRequestView,
} from '@/views/TransactionRequestView';

export default function SignersPage() {
  const { account, login } = useAccountContext();
  const { createPasskey } = usePasskeyRegistration();
  const [enrichedTransactionRequest, setEnrichedTransactionRequest] =
    useState<EnrichedTransactionRequest | null>(null);
  const { openDrawer, DrawerComponent } = useRequestDrawer();
  const transactionActions = TransactionRequestView.useActions({
    openDrawer,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { sendTransaction } = useTransaction();

  const handleAddPasskey = async () => {
    setIsLoading(true);
    const result = await createPasskey();

    if (!result) {
      setIsLoading(false);
      return;
    }

    const { txRequest, signer } = result;
    txRequest.paymaster = '0x';
    txRequest.paymasterInput = undefined;

    await sendTransaction(txRequest, null);

    login(
      {
        ...account,
        signer,
      },
      null,
    );

    //  const enrichedTransactionRequest = {
    //   from: txRequest.from,
    //   to: txRequest.to,
    //   value: txRequest.value,
    //   data: txRequest.data,
    //   transactionType: TransactionType.SIGNER,
    //   signer,
    //   recipient: '',
    //   displayValue: '',
    // };

    // setEnrichedTransactionRequest(enrichedTransactionRequest);
    setIsLoading(false);
  };
  return (
    <>
      <Dialog
        className="relative"
        title={
          enrichedTransactionRequest
            ? shortenAddress(account?.address)
            : 'Signers'
        }
        showLegalNotice={false}
        showSettings={false}
        onBack={
          enrichedTransactionRequest
            ? () => {
                setEnrichedTransactionRequest(null);
              }
            : undefined
        }
        dialogType="signers"
        actions={
          enrichedTransactionRequest && transactionActions.renderActions()
        }
      >
        {enrichedTransactionRequest ? (
          <BaseTransactionRequestView
            openDrawer={openDrawer}
            enrichedTransactionRequest={enrichedTransactionRequest}
          />
        ) : (
          <div>
            {' '}
            <Button
              variant="secondary"
              onClick={handleAddPasskey}
              isLoading={isLoading}
              disabled={isLoading}
            >
              Add Passkey signer
            </Button>
            <TestSignaturePanel />
          </div>
        )}
      </Dialog>
      <DrawerComponent />
    </>
  );
}

const TestSignaturePanel = () => {
  const { account } = useAccountContext();

  const signer = account?.signer;
  const passkeySigner: PasskeySigner | undefined =
    signer?.accountType === AccountType.PASSKEY
      ? (signer as PasskeySigner)
      : undefined;

  const { signMessage, signTypedData, isSigning, signingError } =
    useSignature();

  const [signinType, setSigninType] = useState<'message' | 'typed-data' | null>(
    null,
  );
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [signedData, setSignedData] = useState('');
  const [timestamp, setTimestamp] = useState(Date.now());
  const [testType, setTestType] = useState<'hash7339' | 'wrap'>('hash7339');

  const MESSAGE_TO_SIGN = 'Hello from Sophon SSO!';
  // biome-ignore lint/suspicious/noExplicitAny: review
  const TYPED_DATA_TO_SIGN: any = (
    address: `0x${string}`,
    timestamp: number,
  ) => {
    return {
      domain: {
        name: 'Sso1271',
        version: '1.0.0',
        chainId: sophonTestnet.id,
        verifyingContract: address,
      },
      types: {
        Person: [
          { name: 'name', type: 'string' },
          { name: 'address', type: 'address' },
        ],
        Mail: [
          { name: 'content', type: 'string' },
          { name: 'from', type: 'Person' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
      primaryType: 'Mail',
      message: {
        content: `Hello from Sophon SSO!\n\nThis message confirms you control this wallet.`,
        from: {
          name: 'Little Billy',
          address: address,
        },
        timestamp: timestamp,
      },
    };
  };

  const handleSignMessage = async () => {
    setSigninType('message');
    const messageData = await signMessage({
      message: MESSAGE_TO_SIGN,
      address: account!.address!,
    });
    setSignedData(messageData);
  };

  const handleSignTypedData = async () => {
    setSigninType('typed-data');
    const timestamp = Math.floor(Date.now() / 1000);
    setTimestamp(timestamp);
    const typedData = await signTypedData(
      TYPED_DATA_TO_SIGN(account!.address!, timestamp),
    );
    setSignedData(typedData);
  };

  useEffect(() => {
    isSigning && setIsValid(null) && setSignedData('');
  }, [isSigning]);

  const handleValidateSignature = async () => {
    setIsValidating(true);

    if (signinType === 'typed-data') {
      const hashFunction =
        signer?.accountType === AccountType.PASSKEY
          ? testType === 'hash7339'
            ? hash7339
            : hashTypedData
          : hashTypedData;

      try {
        const messageHash = hashFunction({
          ...TYPED_DATA_TO_SIGN(account!.address!, timestamp),
          verifierDomain: {
            name: 'Sso1271',
            version: '1.0.0',
            chainId: sophonTestnet.id,
            verifyingContract: account!.address!,
            salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
        });

        if (
          signer?.accountType === AccountType.PASSKEY &&
          testType === 'wrap'
        ) {
          const newSig = wrapTypedDataSignature({
            ...TYPED_DATA_TO_SIGN(account!.address!, timestamp),
            signature: signTypedData,
          });

          const isValidSignature = await validateSmartAccountSignature(
            messageHash,
            newSig!,
            account!.address!,
          );
          setIsValid(isValidSignature);
        } else {
          const isValidSignature = await validateSmartAccountSignature(
            messageHash,
            signedData!,
            account!.address!,
          );
          setIsValid(isValidSignature);
        }
      } catch (error) {
        console.error(error);
        setIsValid(false);
      }
    } else if (signinType === 'message') {
      const messageHash = hashMessage(MESSAGE_TO_SIGN as string);
      const isValidSignature = await validateSmartAccountSignature(
        messageHash,
        signedData!,
        account!.address!,
      );
      setIsValid(isValidSignature);
    }
    setIsValidating(false);
  };

  return signer ? (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <p>
          <span className="font-bold">Current signer</span> {signer.accountType}
        </p>
        {signer?.accountType === AccountType.PASSKEY ? (
          <>
            <p>Credential: {passkeySigner!.credential.id}</p>
            <p>Name: {passkeySigner!.username}</p>
          </>
        ) : (
          <p>K1 Signer: {(signer as k1Signer).address}</p>
        )}
      </div>
      <div className="flex flex-row gap-2 mt-4 w-full">
        <button
          className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
          onClick={handleSignMessage}
          type="button"
        >
          ✍️{' '}
          {isSigning && signinType === 'message'
            ? 'Signing...'
            : 'Sign Message'}
        </button>
        <button
          className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
          onClick={handleSignTypedData}
          type="button"
        >
          ✍️{' '}
          {isSigning && signinType === 'typed-data'
            ? 'Signing...'
            : 'Sign Typed Data'}
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-4 w-full">
        {signingError && (
          <p className="text-sm  bg-white p-2 rounded-md border border-red-400 text-red-400 text-center">
            {signingError}
          </p>
        )}
        {signinType && signedData !== undefined && signedData !== '' && (
          <>
            <p className="text-sm bg-white p-2 rounded-md border border-yellow-400 text-yellow-400 break-all">
              {signedData}
            </p>
            <button
              className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
              onClick={handleValidateSignature}
              disabled={isValidating}
              type="button"
            >
              ✅{isValidating ? ' Validating...' : ' Validate Signature'}
            </button>
            {isValid !== null && isValid && (
              <p className="text-sm bg-white p-2 rounded-md border border-green-400 text-green-400 text-center">
                Signature is valid
              </p>
            )}
            {isValid !== null && !isValid && (
              <p className="text-sm bg-white p-2 rounded-md border border-red-400 text-red-400 text-center">
                Signature is invalid
              </p>
            )}

            {signer?.accountType === AccountType.PASSKEY && (
              <div>
                <input
                  type="radio"
                  name="testType"
                  value="hash7339"
                  checked={testType === 'hash7339'}
                  onChange={() => setTestType('hash7339')}
                />
                <label htmlFor="hash7339">Hash7339</label>
                <input
                  type="radio"
                  name="testType"
                  value="wrap"
                  checked={testType === 'wrap'}
                  onChange={() => setTestType('wrap')}
                />
                <label htmlFor="wrap">Wrap</label>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  ) : null;
};
