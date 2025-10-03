import { useState } from 'react';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { windowService } from '@/service/window.service';

export function useConsentAuthorization() {
  const { incoming } = MainStateMachineContext.useSelector(
    (state) => state.context.requests,
  );
  const actorRef = MainStateMachineContext.useActorRef();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRefuseConsent = async () => {
    if (!incoming) return;

    const response = {
      id: crypto.randomUUID(),
      requestId: incoming.id,
      content: {
        result: null,
        error: {
          message: 'User refused the consent request.',
          code: -32002,
        },
      },
    };

    windowService.sendMessage(response);
    actorRef.send({ type: 'ACCEPT' });
  };

  const onAcceptConsent = async (consentData: {
    consentAds: boolean;
    consentData: boolean;
  }) => {
    if (!incoming) return;

    setIsLoading(true);
    setError(null);

    try {
      // Handle consent approval logic here
      const response = {
        id: crypto.randomUUID(),
        requestId: incoming.id,
        content: {
          result: {
            consentAds: consentData.consentAds,
            consentData: consentData.consentData,
          },
        },
      };

      windowService.sendMessage(response);
      actorRef.send({ type: 'ACCEPT' });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Consent processing failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    onRefuseConsent,
    onAcceptConsent,
    isLoading,
    error,
  };
}
