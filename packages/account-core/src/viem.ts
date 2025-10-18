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

export function sophonActions() {
  return (client: WalletClient) => ({
    /**
     * Exemplo: checa saldo formatado
     */
    async requestConsent(): Promise<ConsentResponse> {
      const requestArgs: SophonRequestConsentArgs = {
        method: 'sophon_requestConsent',
        params: [],
      };

      console.log('requestArgs', requestArgs);
      return client.request<
        SophonRequestConsentOverride,
        SophonRequestConsentArgs
      >(requestArgs);
    },
  });
}
