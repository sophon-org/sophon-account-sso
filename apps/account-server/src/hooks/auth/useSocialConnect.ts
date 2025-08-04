import { useSocialAccounts } from '@dynamic-labs/sdk-react-core';
import type { ProviderEnum } from '@dynamic-labs/types';
import { useCallback, useEffect } from 'react';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { setSocialProviderInURL } from '@/lib/social-provider';

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
      // Store provider in URL for OAuth redirect preservation
      setSocialProviderInURL(provider);

      actorRef.send({ type: 'AUTHENTICATION_STARTED' });
      await signInWithSocialAccount(provider);
    },
    [actorRef, signInWithSocialAccount],
  );
}
