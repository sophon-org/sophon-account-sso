import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { type ChainId, isOsChainId } from '@sophon-labs/account-core';
import { useMemo, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAccountContext } from '@/hooks/useAccountContext';
import { trackTransactionResult } from '@/lib/analytics';
import { SOPHON_VIEM_CHAIN } from '@/lib/constants';
import { windowService } from '@/service/window.service';
import type { IncomingRequest, TransactionRequest } from '@/types/auth';
import { createOsChainTransaction } from './transaction/osChainTransaction';
import { createZksyncTransaction } from './transaction/zksyncChainTransaction';

export function useTransaction() {
  const { account } = useAccountContext();
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { primaryWallet } = useDynamicContext();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actorRef = MainStateMachineContext.useActorRef();
  const isOsChain = isOsChainId(SOPHON_VIEM_CHAIN.id as ChainId);

  const transactor = useMemo(
    () =>
      isOsChain
        ? createOsChainTransaction({
            account,
            connectedAddress,
            walletClient,
            primaryWallet: primaryWallet ?? undefined,
            isEOAAccount: !account?.owner.passkey,
          })
        : createZksyncTransaction({
            account,
            connectedAddress,
            walletClient,
            primaryWallet: primaryWallet ?? undefined,
            isEOAAccount: !account?.owner.passkey,
          }),
    [account, connectedAddress, isOsChain, primaryWallet, walletClient],
  );

  const sendTransaction = async (
    transactionRequest: TransactionRequest,
    incomingRequest?: IncomingRequest,
  ) => {
    setIsSending(true);
    const availableAddress = account?.address || primaryWallet?.address;
    if (!availableAddress) {
      throw new Error('No account address available');
    }
    try {
      const txHash = await transactor.sendTransaction(transactionRequest);

      trackTransactionResult(true, txHash);

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
      setError(error instanceof Error ? error.message : 'Transaction failed');
      // Track failed transaction
      const errorMessage =
        error instanceof Error ? error.message : 'Transaction failed';
      trackTransactionResult(false, undefined, errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return {
    isSending,
    sendTransaction,
    transactionError: error,
  };
}
