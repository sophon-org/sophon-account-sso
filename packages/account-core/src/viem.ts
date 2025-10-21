import type { WalletClient } from 'viem';

export interface ConsentResponse {
  consentAds: boolean;
  consentData: boolean;
}

type SophonRequestConsentParameters = readonly [];

type SophonRequestConsentArgs = {
  method: 'sophon_requestConsent';
  params: SophonRequestConsentParameters;
};

type SophonRequestConsentOverride = {
  Parameters: SophonRequestConsentParameters;
  ReturnType: ConsentResponse;
};

/**
 * Sophon Custom RPC Actions extension for Viem
 *
 * @returns eclusive viem actions for sophon
 */
export function sophonActions() {
  return (client: WalletClient) => ({
    /**
     * Data consent request
     * @returns consent response
     */
    async requestConsent(): Promise<ConsentResponse> {
      const requestArgs: SophonRequestConsentArgs = {
        method: 'sophon_requestConsent',
        params: [],
      };

      return client.request<
        SophonRequestConsentOverride,
        SophonRequestConsentArgs
      >(requestArgs);
    },
  });
}
