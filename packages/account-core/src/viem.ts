import type { SmartSessionActions } from '@biconomy/abstractjs';

import {
  type Address,
  type Chain,
  type CustomTransport,
  createWalletClient,
  type WalletClient,
} from 'viem';
import type { SessionAction } from './biconomy';

// Consent Types
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

// Session Permission Types
export type SessionPermissionResponse = Awaited<
  ReturnType<SmartSessionActions<undefined>['grantPermissionTypedDataSign']>
>;

type SophonRequestSessionPermissionParameters = readonly [
  Address,
  SessionAction[],
];

type SophonRequestSessionPermissionArgs = {
  method: 'sophon_requestSessionPermission';
  params: SophonRequestSessionPermissionParameters;
};

type SophonRequestSessionPermissionOverride = {
  Parameters: SophonRequestSessionPermissionParameters;
  ReturnType: SessionPermissionResponse;
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

    /**
     * Request session permission
     *
     * @param actions - The actions to request session permission for
     * @returns session permission response
     */
    async requestSessionPermission(
      signer: Address,
      actions: SessionAction[],
    ): Promise<SessionPermissionResponse> {
      const requestArgs: SophonRequestSessionPermissionArgs = {
        method: 'sophon_requestSessionPermission',
        params: [signer, actions],
      };

      return client.request<
        SophonRequestSessionPermissionOverride,
        SophonRequestSessionPermissionArgs
      >(requestArgs);
    },
  });
}

// get the first parameter of exentend function
export type WalletClientExtension = Parameters<
  NonNullable<WalletClient['extend']>
>[0];

export const createSophonWalletClient = (
  chain: Chain,
  transport: CustomTransport,
) => {
  const baseClient = createWalletClient({
    chain,
    transport,
  });

  return baseClient.extend(sophonActions());
};

export type SophonWalletClient = ReturnType<typeof createSophonWalletClient>;
