import { useSocialAccounts } from '@dynamic-labs/sdk-react-core';
import type { ProviderEnum } from '@dynamic-labs/types';
import { useCallback, useEffect } from 'react';
import { MainStateMachineContext } from '@/context/state-machine-context';

export function useSocialConnect() {
  const actorRef = MainStateMachineContext.useActorRef();
  const { signInWithSocialAccount, error } = useSocialAccounts();

  useEffect(() => {
    if (error?.message) {
      console.error('❌ Social authentication failed:', error);
      actorRef.send({ type: 'ACCOUNT_ERROR' });
      actorRef.send({
        type: 'SET_ERROR',
        error: error.message ?? 'Social authentication failed.',
      });
    }
  }, [error, actorRef]);

  return useCallback(
    async (provider: ProviderEnum) => {
      actorRef.send({ type: 'AUTHENTICATION_STARTED' });
      await signInWithSocialAccount(provider);
    },
    [actorRef, signInWithSocialAccount],
  );
}
