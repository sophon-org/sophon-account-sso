import {
  getMEEVersion,
  MEEVersion,
  toNexusAccount,
} from '@biconomy/abstractjs';
import {
  AuthService,
  CHAIN_CONTRACTS,
  checkChainCapability,
  isOsChainId,
  predictNexusOffchainByChain,
  safeParseTypedData,
} from '@sophon-labs/account-core';
import { useCallback, useMemo } from 'react';
import {
  type Address,
  concat,
  domainSeparator,
  encodeAbiParameters,
  http,
  keccak256,
  parseAbiParameters,
} from 'viem';
import type { SophonAccount } from '../context/sophon-context';
import { sendUIMessage } from '../messaging';
import { getRefusedRPC } from '../messaging/utils';
import { useEmbeddedAuth } from './use-embedded-auth';
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
    requiresAuthorization,
    currentRequestId,
  } = useSophonContext();
  const { getAccessToken } = useSophonToken();
  const {
    waitForAuthentication,
    embeddedUserId,
    createEmbeddedWalletClient,
    createEmbeddedAccountSigner,
  } = useEmbeddedAuth();
  const method = useMemo(() => {
    // biome-ignore lint/suspicious/noExplicitAny: to type better later
    const content: any = currentRequest?.content;
    return content?.action?.method;
  }, [currentRequest]);

  const clearCurrentRequest = useCallback(() => {
    setCurrentRequest(undefined);
  }, [setCurrentRequest]);

  const authorize = useCallback(
    async (fields: string[], directAccount?: SophonAccount) => {
      const account = directAccount ?? connectingAccount;
      if (!account?.address) {
        throw new Error('No account address found');
      }

      // request nonce
      const nonce = await AuthService.requestNonce(
        chainId,
        account.address.toLowerCase() as Address,
        partnerId,
        fields,
        embeddedUserId,
      );

      let tokens: {
        accessToken: string;
        accessTokenExpiresAt: number;
        refreshToken: string;
        refreshTokenExpiresAt: number;
      };

      if (isOsChainId(chainId)) {
        try {
          const appDomain = {
            chainId: chainId,
            name: 'Sophon SSO',
            verifyingContract: account.address as Address,
            version: '1',
          };

          const content = `Do you authorize this website to connect?!\n\nThis message confirms you control this wallet.`;
          const primaryType = 'Contents';
          const types = {
            Contents: [
              {
                name: 'stuff',
                type: 'bytes32',
              },
            ],
          } as const;

          const abiParameters = embeddedUserId
            ? 'string,address,string,string,string'
            : 'string,address,string,string';
          const abiValues = embeddedUserId
            ? [content, account.address, nonce, partnerId, embeddedUserId]
            : [content, account.address, nonce, partnerId];

          const message = {
            stuff: keccak256(
              encodeAbiParameters(
                parseAbiParameters(abiParameters),
                abiValues as [string, `0x${string}`, string, string],
              ),
            ),
          };

          const appDomainSeparator = domainSeparator({ domain: appDomain });

          const contentsHash = keccak256(
            concat(['0x1901', appDomainSeparator, message.stuff]),
          );

          const signAuth = {
            domain: appDomain,
            types,
            primaryType,
            address: account.address,
            message,
            contentsHash,
          };

          const safePayload = safeParseTypedData(signAuth);
          const ownerAccount = await createEmbeddedAccountSigner();
          const smartAccount = await toNexusAccount({
            signer: ownerAccount,
            chainConfiguration: {
              chain: chain,
              transport: http(),
              version: getMEEVersion(MEEVersion.V2_1_0),
              versionCheck: false,
            },
          });

          const signature = await smartAccount.signTypedData({
            domain: safePayload.domain,
            primaryType: safePayload.primaryType,
            types: safePayload.types,
            message: safePayload.message,
          });

          tokens = await AuthService.requestToken(
            chainId,
            account.address.toLowerCase() as Address,
            signAuth,
            signature,
            nonce,
            undefined,
            partnerId,
            signAuth.contentsHash,
          );
        } catch (error) {
          console.error('Failed to authorize', error);
          throw error;
        }
      } else {
        // request signature
        const messageFields = [
          { name: 'content', type: 'string' },
          { name: 'from', type: 'address' },
          { name: 'nonce', type: 'string' },
          { name: 'audience', type: 'string' },
        ];

        const message = {
          content: `Do you authorize this website to connect?!\n\nThis message confirms you control this wallet.`,
          from: account.address.toLowerCase(),
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
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' },
            ],
          },
          primaryType: 'Message',
          address: account.address.toLowerCase(),
          message: embeddedUserId
            ? { ...message, userId: embeddedUserId }
            : message,
        };

        const safePayload = safeParseTypedData(signAuth);

        const embeddedWalletClient = await createEmbeddedWalletClient();

        const { onChain: onChainDeploy } = checkChainCapability(
          chainId,
          'deployContract',
        );

        const signature = await embeddedWalletClient.signTypedData({
          domain: safePayload.domain,
          types: safePayload.types,
          primaryType: safePayload.primaryType,
          message: safePayload.message,
          // if the contract deployment is disabled, then we use the owner address as signer,
          // so we can actually issue the JWT token that can be verified on the server
          account: (onChainDeploy
            ? account.address
            : account.owner
          ).toLowerCase() as Address,
        });

        // exchange tokens
        tokens = await AuthService.requestToken(
          chainId,
          account.address.toLowerCase() as Address,
          signAuth,
          signature,
          nonce,
          // if the contract deployment is disabled, we don't send the owner, its only
          // required in the server if there's no contract deployment
          onChainDeploy ? undefined : (account.owner.toLowerCase() as Address),
          partnerId,
        );
      }

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

      setAccount({ ...account });
      setConnectingAccount(undefined);
      if (currentRequest) {
        sendUIMessage('incomingRpc', {
          id: crypto.randomUUID(),
          requestId: currentRequest.id,
          content: {
            result: {
              account: {
                address: account.address,
                activeChainId: chainId,
              },
              chainsInfo: [
                {
                  id: chainId,
                  capabilities: {
                    paymasterService: { supported: true },
                    atomicBatch: { supported: true },
                    auxiliaryFunds: { supported: true },
                  },
                  contracts: {
                    accountFactory: CHAIN_CONTRACTS[chainId].accountFactory,
                    passkey: CHAIN_CONTRACTS[chainId].passkey,
                    session: CHAIN_CONTRACTS[chainId].session,
                    recovery: CHAIN_CONTRACTS[chainId].recovery,
                    accountPaymaster: CHAIN_CONTRACTS[chainId].accountPaymaster,
                  },
                },
              ],
            },
          },
        });
      }

      sendUIMessage('onLoginSuccess', {
        address: account.address,
        owner: account.owner,
        accessToken: tokens.accessToken,
      });
    },
    [
      connectingAccount,
      setAccount,
      updateAccessToken,
      updateRefreshToken,
      createEmbeddedWalletClient,
      currentRequest,
      chain,
      chainId,
      partnerId,
      embeddedUserId,
      setConnectingAccount,
      setCurrentRequest,
      createEmbeddedAccountSigner,
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
        if (response?.contracts.length) {
          accounts = response.contracts;
        }
      } else if (offChainDeploy) {
        const { address } = predictNexusOffchainByChain({
          chainId: chainId,
          owner,
        });
        accounts = [address];
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
      if (!requiresAuthorization) {
        await authorize([], desiredAccount);
      }
    },
    [setConnectingAccount, requiresAuthorization, authorize, chainId],
  );

  const cancelCurrentRequest = useCallback(() => {
    if (currentRequestId.current) {
      sendUIMessage('incomingRpc', getRefusedRPC(currentRequestId.current));
      clearCurrentRequest();
    }
  }, [currentRequestId, clearCurrentRequest]);

  const consent = useCallback(
    async (kinds: string[]) => {
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
    },
    [chainId, getAccessToken, currentRequest, setCurrentRequest],
  );

  return {
    hasRequest: !!currentRequest,
    method,
    currentRequest,
    setCurrentRequest,
    clearCurrentRequest,
    cancelCurrentRequest,
    connectingAccount,
    actions: {
      authenticate,
      authorize,
      consent,
      waitForAuthentication,
    },
  };
};
