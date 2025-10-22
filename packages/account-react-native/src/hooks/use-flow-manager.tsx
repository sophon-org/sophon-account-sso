import { AuthService, safeParseTypedData } from '@sophon-labs/account-core';
import { useCallback, useMemo } from 'react';
import type { Address } from 'viem';
import { useEmbeddedAuth } from '../auth/useAuth';
import { sendUIMessage } from '../messaging';
import { getRefusedRPC } from '../messaging/utils';
import { useSophonContext } from './use-sophon-context';
import { useSophonToken } from './use-sophon-token';

export const useFlowManager = () => {
  const {
    currentRequest,
    setCurrentRequest,
    setAccount,
    partnerId,
    chain,
    chainId,
    updateAccessToken,
    updateRefreshToken,
    setConnectingAccount,
    connectingAccount,
  } = useSophonContext();
  const { getAccessToken } = useSophonToken();
  const { waitForAuthentication, embeddedUserId, createEmbeddedWalletClient } =
    useEmbeddedAuth();
  const method = useMemo(() => {
    // biome-ignore lint/suspicious/noExplicitAny: to type better later
    const content: any = currentRequest?.content;
    return content?.action?.method;
  }, [currentRequest]);

  const clearCurrentRequest = useCallback(() => {
    setCurrentRequest(undefined);
  }, []);

  const authenticate = useCallback(
    async (owner: Address) => {
      setConnectingAccount(undefined);

      let accounts = await AuthService.getSmartAccount(chainId, owner);

      if (!accounts.length) {
        const response = await AuthService.deploySmartAccount(chainId, owner);
        if (response.contracts.length) {
          accounts = response.contracts;
        }
      }

      if (!accounts?.length || !accounts[0]) {
        throw new Error('Failed to deploy smart account');
      }

      console.log('setting connecting account', {
        address: accounts[0],
        owner: owner,
      });

      console.log('setting connecting account');
      setConnectingAccount({
        address: accounts[0],
        owner: owner,
      });
      // setCurrentRequest(undefined);
    },
    [setConnectingAccount],
  );

  const authorize = useCallback(
    async (fields: string[]) => {
      if (!connectingAccount?.address) {
        throw new Error('No account address found');
      }

      // request nonce
      const nonce = await AuthService.requestNonce(
        chainId,
        connectingAccount.address,
        partnerId,
        fields,
        embeddedUserId,
      );

      // request signature
      const messageFields = [
        { name: 'content', type: 'string' },
        { name: 'from', type: 'address' },
        { name: 'nonce', type: 'string' },
        { name: 'audience', type: 'string' },
      ];

      const message = {
        content: `Do you authorize this website to connect?!\n\nThis message confirms you control this wallet.`,
        from: connectingAccount.address,
        nonce,
        audience: partnerId,
      };

      const signAuth = {
        domain: {
          name: 'Sophon SSO',
          version: '1',
          chainId: chain.id,
        },
        types: {
          Message: embeddedUserId
            ? [...messageFields, { name: 'userId', type: 'string' }]
            : messageFields,
        },
        primaryType: 'Message',
        address: connectingAccount.address,
        message: embeddedUserId
          ? { ...message, userId: embeddedUserId }
          : message,
      };

      const safePayload = safeParseTypedData(signAuth);

      const embeddedWalletClient = await createEmbeddedWalletClient();

      const signature = await embeddedWalletClient.signTypedData({
        domain: safePayload.domain,
        types: safePayload.types,
        primaryType: safePayload.primaryType,
        message: safePayload.message,
        // TODO: review this to allow call to the blockchain if in the right chain
        account: connectingAccount.owner,
      });

      // exchange tokens
      const tokens = await AuthService.requestToken(
        chainId,
        connectingAccount.address,
        signAuth,
        signature,
        nonce,
        connectingAccount.owner,
      );

      // save tokens
      setCurrentRequest(undefined);

      updateAccessToken({
        value: tokens.accessToken,
        expiresAt: tokens.accessTokenExpiresAt,
      });
      updateRefreshToken({
        value: tokens.refreshToken,
        expiresAt: tokens.refreshTokenExpiresAt,
      });

      setAccount({ ...connectingAccount });
      setConnectingAccount(undefined);
      // await 500 ms to allow react to propagate the change, to remove in the future
      // await new Promise((resolve) => setTimeout(resolve, 500));
    },
    [
      connectingAccount,
      setAccount,
      updateAccessToken,
      updateRefreshToken,
      createEmbeddedWalletClient,
    ],
  );

  const consent = useCallback(async (kinds: string[]) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('No access token found');
    }
    const consentResponse = await AuthService.requestConsent(
      chainId,
      accessToken.value,
      kinds,
    );

    // force refresh the token so we have the updated consent claims
    await getAccessToken(true);

    sendUIMessage('incomingRpc', {
      id: crypto.randomUUID(),
      requestId: currentRequest!.id,
      content: {
        result: {
          consentAds: consentResponse.some(
            (consent: { kind: string }) =>
              consent.kind === 'PERSONALIZATION_ADS',
          ),
          consentData: consentResponse.some(
            (consent: { kind: string }) => consent.kind === 'SHARING_DATA',
          ),
        },
      },
    });

    setCurrentRequest(undefined);
  }, []);

  return {
    hasRequest: !!currentRequest,
    method,
    currentRequest,
    setCurrentRequest,
    clearCurrentRequest,
    cancelCurrentRequest: () => {
      if (currentRequest?.id) {
        sendUIMessage('incomingRpc', getRefusedRPC(currentRequest.id));
        clearCurrentRequest();
      }
    },
    connectingAccount,
    actions: {
      authenticate,
      authorize,
      consent,
      waitForAuthentication,
    },
  };
};
