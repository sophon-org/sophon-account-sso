import {
  AuthService,
  checkChainCapability,
  safeParseTypedData,
} from '@sophon-labs/account-core';
import { useCallback, useMemo } from 'react';
import type { Address } from 'viem';
import { useEmbeddedAuth } from '../auth/useAuth';
import type { SophonAccount } from '../context/sophon-context';
import { Capabilities } from '../lib/capabilities';
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
    capabilities,
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

  const authorize = useCallback(
    async (fields: string[], directAccount?: SophonAccount) => {
      const account = directAccount ?? connectingAccount;
      console.log('authorizing', account?.address);
      if (!account?.address) {
        throw new Error('No account address found');
      }

      const { onChain: onChainDeploy } = checkChainCapability(
        chainId,
        'deployContract',
      );

      // request nonce
      const nonce = await AuthService.requestNonce(
        chainId,
        account.address,
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
        from: account.address,
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
        address: account.address,
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
        // if the contract deployment is disabled, then we use the owner address as signer,
        // so we can actually issue the JWT token that can be verified on the server
        account: onChainDeploy ? account.address : account.owner,
      });

      // exchange tokens
      const tokens = await AuthService.requestToken(
        chainId,
        account.address,
        signAuth,
        signature,
        nonce,
        // if the contract deployment is disabled, we don't send the owner, its only
        // required in the server if there's no contract deployment
        onChainDeploy ? undefined : account.owner,
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

      console.log('setting account', account);

      setAccount({ ...account });
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

  const authenticate = useCallback(
    async (owner: Address) => {
      setConnectingAccount(undefined);

      let accounts = await AuthService.getSmartAccount(chainId, owner);
      const { onChain: onChainDeploy, offChain: offChainDeploy } =
        checkChainCapability(chainId, 'deployContract');

      if (onChainDeploy && !accounts.length) {
        const response = await AuthService.deploySmartAccount(chainId, owner);
        if (response.contracts.length) {
          accounts = response.contracts;
        }
      } else if (offChainDeploy) {
        // TODO: fetch the contract info from server, for now use owner as both @israel and @roman.h
        // TODO: BEFORE PROD !!! IMPORTANT !!!
        accounts = [owner];
      }

      if (!accounts?.length || !accounts[0]) {
        throw new Error('Failed to deploy smart account');
      }

      const desiredAccount = {
        address: accounts[0],
        owner: owner,
      };
      setConnectingAccount(desiredAccount);

      // if the modal is not enabled, we need to issue the authorization on behalf of the user with
      // limited data scopes for the partner
      if (!capabilities.includes(Capabilities.AUTHORIZATION_MODAL)) {
        await authorize([], desiredAccount);
      }
    },
    [setConnectingAccount, capabilities, authorize],
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
