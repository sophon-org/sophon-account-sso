import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { trackAuthFailed, updateUserProperties } from '@/lib/analytics';
import { setSocialProviderInURL } from '@/lib/social-provider';
import { type OAuthProvider, useOAuth } from '@openfort/react';

export function useSocialConnect() {
  const actorRef = MainStateMachineContext.useActorRef();
  const searchParams = useSearchParams();
  const { initOAuth, error } = useOAuth({
    redirectTo: searchParams.get('redirectUrl') ?? undefined,
  });

  useEffect(() => {
    if (error?.message) {
      console.error('❌ Social authentication failed:', error);
      trackAuthFailed(
        'social',
        error.message ?? 'Social authentication failed',
        'social_connect',
      );
      actorRef.send({ type: 'ACCOUNT_ERROR' });
      actorRef.send({
        type: 'SET_ERROR',
        error: error.message ?? 'Social authentication failed.',
      });
    }
  }, [error, actorRef]);

  return useCallback(
    async (provider: OAuthProvider) => {
      // Store provider in URL for OAuth redirect preservation
      setSocialProviderInURL(provider);

      // Update user properties with social auth info
      updateUserProperties({
        authMethod: 'social',
        socialProvider: provider,
        social_auth_started_at: new Date().toISOString(),
      });

      actorRef.send({ type: 'AUTHENTICATION_STARTED' });
      await initOAuth({ provider });
    },
    [actorRef, initOAuth],
  );
}
