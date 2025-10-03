import { useCallback } from 'react';
import { useSophonContext } from './useSophonContext';

export interface ConsentRequest {
  action: string;
  params: unknown[];
}

export interface ConsentResponse {
  id: string;
  content: {
    action: {
      method: string;
      params: unknown[];
    };
  };
}

export const useSophonConsent = () => {
  const { communicator, accessToken } = useSophonContext();
  const requestConsent = useCallback(
    //first I need to check if user has already consented to this action if so I dont need to request consent
    async (consentData: ConsentRequest) => {
      const request = {
        id: crypto.randomUUID(),
        content: {
          action: {
            method: 'sophon_requestConsent',
            params: [consentData],
          },
        },
      };

      const response =
        await communicator.postRequestAndWaitForResponse(request);
      return response;
    },
    [communicator],
  );
  return {
    requestConsent,
  };
};
