import { useCallback } from 'react';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useWalletConnection } from '../useWalletConnection';

export function useEOAConnect() {
  const actorRef = MainStateMachineContext.useActorRef();
  const { connectWallet } = useWalletConnection();

  return useCallback(
    async (connectorName: string) => {
      console.log('🔑 Connecting to wallet:', connectorName);
      actorRef.send({ type: 'WALLET_SELECTED' });
      try {
        await connectWallet(connectorName);
      } catch (error) {
        console.error('❌ Wallet connection failed:', error);
      }
    },
    [actorRef, connectWallet],
  );
}
