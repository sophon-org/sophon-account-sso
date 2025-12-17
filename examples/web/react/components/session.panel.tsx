import {
  executeSessionInstructions,
  type SessionPermissionResponse,
  sophonOSTestnet,
} from '@sophon-labs/account-core';
import { useSophonAccount, useSophonSession } from '@sophon-labs/account-react';
import { useMemo, useState } from 'react';
import {
  type Address,
  encodeFunctionData,
  type Hex,
  toFunctionSelector,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const mockContractAddress =
  '0xbec653fDeb100CAbE90c8b451d4D209D90f0C441' as Address;
const mockContractSelector = toFunctionSelector(
  'function increment() external',
);

export default function SessionPanel() {
  const { account } = useSophonAccount();
  const {
    requestSessionPermission,
    isLoading,
    error: sessionError,
  } = useSophonSession();
  const [sessionPermission, setSessionPermission] =
    useState<SessionPermissionResponse | null>(null);

  const signerAccount = useMemo(() => {
    return privateKeyToAccount(process.env.NEXT_PUBLIC_SIGNER_PK as Hex);
  }, []);

  const requestSession = async () => {
    const response = await requestSessionPermission(signerAccount.address, [
      {
        actionTarget: mockContractAddress as Address,
        actionTargetSelector: mockContractSelector,
        actionPolicies: [
          {
            policy: '0x0000000000FEEc8D74e3143fBaBbca515358d869',
            initData: '0x',
          },
        ],
      },
    ]);
    console.log(response);
    setSessionPermission(response);
  };

  const useSession = async () => {
    if (!sessionPermission) {
      throw new Error('No session permission found');
    }

    try {
      const response = await executeSessionInstructions(
        sophonOSTestnet.id,
        signerAccount,
        account.address,
        sessionPermission,
        [
          {
            chainId: sophonOSTestnet.id,
            calls: [
              {
                to: mockContractAddress,
                value: BigInt(0),
                data: encodeFunctionData({
                  abi: [
                    {
                      name: 'increment',
                      type: 'function',
                      inputs: [],
                      outputs: [],
                      stateMutability: 'nonpayable',
                    },
                  ],
                  functionName: 'increment',
                }),
              },
            ],
          },
        ],
        process.env.NEXT_PUBLIC_SPONSORSHIP_API_KEY as string,
      );

      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2 w-full">
      <span>(Signer: {signerAccount.address})</span>
      <button
        className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-700 hover:cursor-pointer border border-black/40"
        onClick={requestSession}
        type="button"
      >
        {isLoading ? 'Requesting session...' : 'Request Session'}
      </button>
      {sessionError && (
        <p className="text-sm bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
          {(sessionError as { details?: string })?.details ?? sessionError}
        </p>
      )}
      {!!sessionPermission && (
        <>
          <p className="text-sm text-gray-500">Session Permission:</p>
          <div className="text-sm bg-gray-100 p-3 rounded overflow-auto whitespace-pre-wrap break-words max-h-40">
            <pre>
              {JSON.stringify(
                sessionPermission,
                (_, value) =>
                  typeof value === 'bigint' ? value.toString() : value,
                2,
              )}
            </pre>
          </div>
        </>
      )}

      {!!sessionPermission && (
        <button
          className="bg-red-400 text-white p-2 rounded-md w-full hover:bg-red-700 hover:cursor-pointer border border-black/40"
          onClick={useSession}
          type="button"
        >
          {isLoading ? 'Using session...' : 'Use Session'}
        </button>
      )}
    </div>
  );
}
