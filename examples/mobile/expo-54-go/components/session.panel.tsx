import {
  executeSessionInstructions,
  type SessionPermissionResponse,
  sophonOSTestnet,
} from '@sophon-labs/account-core';
import {
  useSophonAccount,
  useSophonClient,
} from '@sophon-labs/account-react-native';
import { useState } from 'react';
import { Text } from 'react-native';
import { type Address, encodeFunctionData, toFunctionSelector } from 'viem';
import { privateKeyToAccount, toAccount } from 'viem/accounts';
import { Button } from './ui/button';

const signerPK =
  '0x6481b563bd4fc0da729186c3a7d100b42f494502ccb9fc06211dd746bdc75162';

const cardVaultProxyAddress =
  '0x0fC78230DDA905063177EC273971a64295d66C36' as Address;

const cardVaultProxyDepositAndSettleSelector = toFunctionSelector(
  'function depositAndSettle(address token_, uint256 amount_) external',
);

const cardVaultProxyDepositSelector = toFunctionSelector(
  'function deposit(address token_, uint256 amount_) external',
);

const tokenAddress = '0x633BC05314E882B0d83aEc3A55ddeF2aEC37363A' as Address;

export const SessionPanel = () => {
  const { walletClient } = useSophonClient();
  const { account } = useSophonAccount();
  const [session, setSession] = useState<SessionPermissionResponse>();
  const [error, setError] = useState<string>('');

  const requestSessionPermission = async () => {
    try {
      const signer = privateKeyToAccount(signerPK);

      setError('');
      const result = await walletClient!.requestSessionPermission(
        signer.address,
        [
          {
            actionTarget: cardVaultProxyAddress,
            actionTargetSelector: cardVaultProxyDepositSelector,
            actionPolicies: [
              {
                policy: '0x0000000000FEEc8D74e3143fBaBbca515358d869',
                initData: '0x',
              },
            ],
          },
          {
            actionTarget: cardVaultProxyAddress,
            actionTargetSelector: cardVaultProxyDepositAndSettleSelector,
            actionPolicies: [
              {
                policy: '0x0000000000FEEc8D74e3143fBaBbca515358d869',
                initData: '0x',
              },
            ],
          },
        ],
      );
      setSession(result);
    } catch (e: any) {
      setError(e.details ?? e.message);
    }
  };

  const useSession = async () => {
    if (!session) {
      throw new Error('No session permission found');
    }

    try {
      const signer = toAccount(privateKeyToAccount(signerPK));
      const response = await executeSessionInstructions(
        sophonOSTestnet.id,
        signer,
        account!.address,
        session,
        [
          {
            chainId: sophonOSTestnet.id,
            calls: [
              {
                to: cardVaultProxyAddress,
                value: BigInt(0),
                data: encodeFunctionData({
                  abi: [
                    {
                      name: 'deposit',
                      type: 'function',
                      inputs: [
                        {
                          name: 'token',
                          type: 'address',
                        },
                        {
                          name: 'amount',
                          type: 'uint256',
                        },
                      ],
                      outputs: [],
                      stateMutability: 'nonpayable',
                    },
                  ],
                  functionName: 'deposit',
                  args: [tokenAddress, BigInt(1000000)],
                }),
              },
            ],
          },
        ],
        'mee_3Zmc7H6Pbd5wUfUGu27aGzdf',
      );

      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <Text className="text-left text-xl font-bold">Sessions</Text>
      <Button
        className="mt-4 bg-purple-500/90 w-full max-w-[80%]"
        onPress={requestSessionPermission}
      >
        <Text className="text font-bold text-white">
          Request Session Permission
        </Text>
      </Button>

      {session && (
        <Text className="text-xs my-4 text-black max-w-[80%]">
          {JSON.stringify(
            session,
            (_, value) =>
              typeof value === 'bigint' ? value.toString() : value,
            2,
          ) ?? 'N/A'}
        </Text>
      )}

      {session && (
        <Button
          className="mt-4 bg-red-500/90 w-full max-w-[80%]"
          onPress={useSession}
        >
          <Text className="text font-bold text-white">Use Session</Text>
        </Button>
      )}

      {error && (
        <Text className="text-xs my-4 text-red-500 max-w-[80%]">
          {error ?? 'N/A'}
        </Text>
      )}
    </>
  );
};
