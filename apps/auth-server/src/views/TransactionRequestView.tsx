import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { isZKsyncConnector } from '@dynamic-labs/ethereum-aa-zksync';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { formatEther, http } from 'viem';
import { toAccount } from 'viem/accounts';
import { useAccount, useWalletClient } from 'wagmi';
import { createZksyncEcdsaClient } from 'zksync-sso/client/ecdsa';
import { createZksyncPasskeyClient } from 'zksync-sso/client/passkey';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAccountContext } from '@/hooks/useAccountContext';
import { CONTRACTS, VIEM_CHAIN } from '@/lib/constants';
import { windowService } from '@/service/window.service';

export default function TransactionRequestView() {
  const { incoming: incomingRequest, transaction: transactionRequest } =
    MainStateMachineContext.useSelector((state) => state.context.requests);
  const { account } = useAccountContext();
  const actorRef = MainStateMachineContext.useActorRef();
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { primaryWallet } = useDynamicContext();

  if (!transactionRequest || !incomingRequest || !account) {
    return <div>No transaction request or account present</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-purple-600">
            Send Transaction
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please review and confirm this transaction
          </p>

          <div className="mt-4 space-y-3">
            <div className="p-3 bg-gray-50 rounded border text-left">
              <p className="text-xs text-gray-500">To:</p>
              <p className="text-sm font-mono break-all text-black">
                {transactionRequest.to}
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded border text-left">
              <p className="text-xs text-gray-500">Value:</p>
              <p className="text-sm text-black">
                {transactionRequest.value && transactionRequest.value !== '0x0'
                  ? `${formatEther(BigInt(transactionRequest.value))} SOPH`
                  : '0 SOPH'}
              </p>
            </div>

            {transactionRequest.data && transactionRequest.data !== '0x' && (
              <div className="p-3 bg-gray-50 rounded border text-left">
                <p className="text-xs text-gray-500">Data:</p>
                <p className="text-xs font-mono break-all text-black">
                  {transactionRequest.data}
                </p>
              </div>
            )}

            <div className="p-3 bg-purple-50 rounded border">
              <p className="text-xs text-gray-500">From:</p>
              <p className="text-sm font-mono break-all text-purple-600">
                {transactionRequest.from}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={async () => {
                console.log(transactionRequest);
                const availableAddress =
                  account.address || primaryWallet?.address;
                if (!availableAddress) {
                  throw new Error('No account address available');
                }
                try {
                  const isEOAAccount = !account.owner.passkey;
                  let txHash: string = '';
                  if (primaryWallet && isEthereumWallet(primaryWallet)) {
                    console.log('Sending transaction with Ethereum wallet...');
                    try {
                      if (isZKsyncConnector(primaryWallet.connector)) {
                        const ecdsaClient =
                          primaryWallet.connector.getAccountAbstractionProvider();

                        txHash = await ecdsaClient.sendTransaction({
                          to: transactionRequest.to as `0x${string}`,
                          value: BigInt(transactionRequest.value || '0'),
                          data:
                            (transactionRequest.data as `0x${string}`) || '0x',
                        });

                        console.log('Transaction sent:', txHash);
                      }
                    } catch (error) {
                      console.error('Transaction error:', error);
                      throw error;
                    }
                  } else if (isEOAAccount) {
                    console.log('Sending transaction with EOA...');
                    const localAccount = toAccount({
                      address: connectedAddress as `0x${string}`,
                      async signMessage({ message }) {
                        const signature = await walletClient?.signMessage({
                          message,
                        });
                        if (!signature)
                          throw new Error('Failed to sign message');
                        return signature; // Now guaranteed to be Hex
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

                    try {
                      const gasEstimate = await client.estimateGas({
                        to: transactionRequest.to as `0x${string}`,
                        value: BigInt(transactionRequest.value || '0'),
                        data:
                          (transactionRequest.data as `0x${string}`) || '0x',
                      });
                      console.log('Gas estimate:', gasEstimate.toString());
                    } catch (gasError) {
                      console.error('Gas estimation failed:', gasError);
                    }

                    txHash = await client.sendTransaction({
                      to: transactionRequest.to as `0x${string}`,
                      value: BigInt(transactionRequest.value || '0'),
                      data: (transactionRequest.data as `0x${string}`) || '0x',
                    });
                  } else {
                    console.log('Sending transaction with Passkey...');
                    if (!account.owner.passkey) {
                      throw new Error('No passkey data available');
                    }

                    const client = createZksyncPasskeyClient({
                      address: account.address as `0x${string}`,
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

                    try {
                      const gasEstimate = await client.estimateGas({
                        to: transactionRequest.to as `0x${string}`,
                        value: BigInt(transactionRequest.value || '0'),
                        data:
                          (transactionRequest.data as `0x${string}`) || '0x',
                      });
                      console.log('Gas estimate:', gasEstimate.toString());
                    } catch (gasError) {
                      console.error('Gas estimation failed:', gasError);
                    }

                    txHash = await client.sendTransaction({
                      to: transactionRequest.to as `0x${string}`,
                      value: BigInt(transactionRequest.value || '0'),
                      data: (transactionRequest.data as `0x${string}`) || '0x',
                      /* paymaster: transactionRequest.paymaster as `0x${string}`,
                      paymasterInput: getGeneralPaymasterInput({
                        innerInput: "0x",
                      }), */
                    });
                  }

                  console.log('Transaction sent:', txHash);

                  if (windowService.isManaged() && incomingRequest) {
                    const txResponse = {
                      id: crypto.randomUUID(),
                      requestId: incomingRequest.id,
                      content: {
                        result: txHash,
                      },
                    };

                    windowService.sendMessage(txResponse);
                    actorRef.send({ type: 'ACCEPT' });
                  }
                } catch (error) {
                  console.error('Transaction failed:', error);
                }
              }}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Send Transaction
            </button>

            <button
              type="button"
              onClick={() => {
                if (windowService.isManaged() && incomingRequest) {
                  const signResponse = {
                    id: crypto.randomUUID(),
                    requestId: incomingRequest.id,
                    content: {
                      result: null,
                      error: {
                        message: 'User cancelled transaction',
                        code: -32002,
                      },
                    },
                  };

                  windowService.sendMessage(signResponse);
                  actorRef.send({ type: 'CANCEL' });
                }
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
