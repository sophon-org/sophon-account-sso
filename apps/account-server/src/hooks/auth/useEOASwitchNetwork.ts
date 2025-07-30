import { useCallback } from 'react';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useWalletConnection } from '../useWalletConnection';

export function useEOASwitchNetwork() {
  const actorRef = MainStateMachineContext.useActorRef();
  const { handleSwitchChain } = useWalletConnection();

  return useCallback(async () => {
    handleSwitchChain();
    actorRef.send({ type: 'SWITCH_NETWORK' });
  }, [actorRef, handleSwitchChain]);
}
