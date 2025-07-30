import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useState } from 'react';
import { http } from 'viem';
import { toAccount } from 'viem/accounts';
import { useAccount, useWalletClient } from 'wagmi';
import { createZksyncEcdsaClient } from 'zksync-sso/client/ecdsa';
import { createZksyncPasskeyClient } from 'zksync-sso/client/passkey';
import { IconSignature } from '@/components/icons/icon-signature';
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import MessageContainer from '@/components/ui/messageContainer';
import VerificationImage from '@/components/ui/verification-image';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAccountContext } from '@/hooks/useAccountContext';
import { CONTRACTS, VIEM_CHAIN } from '@/lib/constants';
import { verifyEIP1271Signature } from '@/lib/smart-contract';
import { windowService } from '@/service/window.service';

export default function SigningRequestView() {
  const { account } = useAccountContext();
  const { incoming, signing } = MainStateMachineContext.useSelector(
    (state) => state.context.requests,
  );
  const actorRef = MainStateMachineContext.useActorRef();
  const [isSigning, setIsSigning] = useState(false);
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { primaryWallet } = useDynamicContext();

  if (!signing || !incoming || !account) {
    return <div>No signing request or account present</div>;
  }

  return (
    <div className="text-center flex flex-col items-center justify-center gap-8 mt-6 px-6">
      <VerificationImage icon={<IconSignature className="w-24 h-24" />} />
      <div className="flex flex-col items-center justify-center">
        <h5 className="text-2xl font-bold">Signature request</h5>
        <p className="hidden">https://my.staging.sophon.xyz</p>
      </div>
      <MessageContainer>
        <div className="text-sm text-black">
          <p>
            {signing.domain.name} v{signing.domain.version}
          </p>
          <pre className="text-xs mt-2 whitespace-pre-wrap break-words">
            {JSON.stringify(signing.message, null, 2)}
          </pre>
        </div>
      </MessageContainer>

      <div className="flex items-center justify-center gap-2 w-full">
        <Button
          variant="transparent"
          onClick={() => {
            if (windowService.isManaged() && incoming) {
              const signResponse = {
                id: crypto.randomUUID(),
                requestId: incoming.id,
                content: {
                  result: null,
                  error: {
                    message: 'User cancelled signing',
                    code: -32002,
                  },
                },
              };

              windowService.sendMessage(signResponse);
              actorRef.send({ type: 'CANCEL' });
            }
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={async () => {
            try {
              setIsSigning(true);
              try {
                const availableAddress =
                  account.address || primaryWallet?.address;
                if (!availableAddress) {
                  throw new Error('No account address available');
                }

                const isEOAAccount = !account.owner.passkey;

                let signature: string;

                if (primaryWallet && isEthereumWallet(primaryWallet)) {
                  try {
                    const client = await primaryWallet.getWalletClient();
                    signature = await client.signTypedData({
                      domain: signing.domain,
                      types: signing.types,
                      primaryType: signing.primaryType,
                      message: signing.message,
                    });
                  } catch (error) {
                    console.error('Signing error:', error);
                    throw error;
                  }
                } else if (isEOAAccount) {
                  if (!connectedAddress) {
                    throw new Error('Wallet not connected for EOA signing!');
                  }

                  const localAccount = toAccount({
                    address: connectedAddress,
                    async signMessage({ message }) {
                      const signature = await walletClient?.signMessage({
                        message,
                      });
                      if (!signature) throw new Error('Failed to sign message');
                      return signature;
                    },
                    async signTransaction(transaction) {
                      const signature = await walletClient?.signTransaction(
                        // @ts-expect-error - Type mismatch between viem account interface and wallet client
                        transaction,
                      );
                      if (!signature)
                        throw new Error('Failed to sign transaction');
                      return signature;
                    },
                    async signTypedData(typedData) {
                      const signature = await walletClient?.signTypedData(
                        // @ts-expect-error - Type mismatch between viem account interface and wallet client
                        typedData,
                      );
                      if (!signature)
                        throw new Error('Failed to sign typed data');
                      return signature;
                    },
                  });

                  const client = await createZksyncEcdsaClient({
                    address: account.address,
                    owner: localAccount,
                    chain: VIEM_CHAIN,
                    transport: http(),
                    contracts: {
                      session: CONTRACTS.session,
                    },
                  });

                  signature = await client.signTypedData({
                    domain: signing.domain,
                    types: signing.types,
                    primaryType: signing.primaryType,
                    message: signing.message,
                  });

                  await verifyEIP1271Signature({
                    accountAddress: signing.address,
                    signature,
                    domain: signing.domain,
                    types: signing.types,
                    primaryType: signing.primaryType,
                    message: signing.message,
                  });
                } else {
                  if (!account.owner.passkey) {
                    throw new Error('No passkey data available for signing');
                  }

                  const client = createZksyncPasskeyClient({
                    address: account.address,
                    credentialPublicKey: account.owner.passkey,
                    userName: account.username || 'Sophon User',
                    userDisplayName: account.username || 'Sophon User',
                    contracts: {
                      accountFactory: CONTRACTS.accountFactory,
                      passkey: CONTRACTS.passkey,
                      session: CONTRACTS.session,
                      recovery: CONTRACTS.recovery,
                    },
                    chain: VIEM_CHAIN,
                    transport: http(),
                  });

                  signature = await client.signTypedData({
                    domain: signing.domain,
                    types: signing.types,
                    primaryType: signing.primaryType,
                    message: signing.message,
                  });

                  await verifyEIP1271Signature({
                    accountAddress: signing.address,
                    signature,
                    domain: signing.domain,
                    types: signing.types,
                    primaryType: signing.primaryType,
                    message: signing.message,
                  });
                }

                if (windowService.isManaged() && incoming) {
                  const signResponse = {
                    id: crypto.randomUUID(),
                    requestId: incoming.id,
                    content: {
                      result: signature,
                    },
                  };

                  console.log(
                    '🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥 signResponse',
                    signResponse,
                  );
                  windowService.sendMessage(signResponse);
                  actorRef.send({ type: 'ACCEPT' });
                }
              } catch (error) {
                console.error('Signing failed:', error);
              }
            } finally {
              setIsSigning(false);
            }
          }}
        >
          {isSigning ? (
            <Loader className="w-4 h-4 border-black border-r-transparent" />
          ) : (
            'Sign'
          )}
        </Button>
      </div>
    </div>
  );
}
