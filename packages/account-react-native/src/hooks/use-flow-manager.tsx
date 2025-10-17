import { safeParseTypedData } from '@sophon-labs/account-core';
import { useCallback, useMemo } from 'react';
import type { Address, TypedDataDefinition } from 'viem';
import { eip712WalletActions } from 'viem/zksync';
import { dynamicClient } from '../lib/dynamic';
import { sendUIMessage } from '../messaging';
import { getRefusedRPC } from '../messaging/utils';
import { useSophonContext } from './use-sophon-context';
import { useSophonToken } from './use-sophon-token';

const getSmartAccount = async (owner: Address) => {
  const response = await fetch(
    `http://localhost:4001/contract/by-owner/${owner}`,
  );
  if (!response.ok) {
    throw new Error(
      `Failed to get indexed smart account by owner: ${response.text()}`,
    );
  }
  return (await response.text()) as Address;
};

const deploySmartAccount = async (owner: Address) => {
  const response = await fetch(`http://localhost:4001/contract/${owner}`, {
    method: 'POST',
  });
  return response.json();
};

// biome-ignore lint/suspicious/noExplicitAny: to do
function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map(stableStringify).join(',')}]`;
  }

  const keys = Object.keys(obj).sort();
  const entries = keys.map(
    (key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`,
  );

  return `{${entries.join(',')}}`;
}

const requestNonce = async (
  address: Address,
  partnerId: string,
  fields: string[],
  userId?: string,
) => {
  const response = await fetch(`http://localhost:4001/auth/nonce`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address, partnerId, fields, userId }),
  });
  return (await response.json()).nonce as string;
};

export const requestToken = async (
  address: Address,
  typedData: TypedDataDefinition,
  signature: string,
  nonceToken: string,
  ownerAddress?: Address, // for now, when we have the blockchain this is not required
) => {
  const response = await fetch(`http://localhost:4001/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      typedData,
      signature,
      nonceToken,
      address,
      ownerAddress,
    }),
  });

  if (!response.ok) {
    console.error(await response.text());
    throw new Error('Failed to verify authorization');
  }

  const result = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
    refreshTokenExpiresAt: number;
  };
  return result;
};

const requestConsent = async (accessToken: string, kinds: string[]) => {
  const consentResponse = await fetch(
    `http://localhost:4001/me/consent/giveMany`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ kinds }),
    },
  );

  if (!consentResponse.ok) {
    const errorText = await consentResponse.text();
    console.error('Consent save failed:', consentResponse.status, errorText);
    throw new Error(`Failed to save consent: ${consentResponse.status}`);
  }

  return consentResponse.json();
};

export const useFlowManager = () => {
  const {
    currentRequest,
    setCurrentRequest,
    setAccount,
    partnerId,
    chain,
    updateAccessToken,
    updateRefreshToken,
    setConnectingAccount,
    connectingAccount,
  } = useSophonContext();
  const { getAccessToken } = useSophonToken();
  const method = useMemo(() => {
    // biome-ignore lint/suspicious/noExplicitAny: to type better later
    const content: any = currentRequest?.content;
    return content?.action?.method;
  }, [currentRequest]);

  const clearCurrentRequest = useCallback(() => {
    setCurrentRequest(undefined);
  }, []);

  const waitForAuthentication = useCallback(async () => {
    return new Promise<Address>((resolve, reject) => {
      // dynamicClient.auth.on('authSuccess', (data) => {
      //   console.log('authSuccess', data);
      //   resolve(data);
      // });

      dynamicClient.wallets.on('primaryChanged', (data) => {
        console.log('primaryChanged', data);

        if (data?.address) {
          resolve(data.address as Address);
        } else {
          reject(new Error('No primary wallet found'));
        }
      });

      dynamicClient.auth.on('authFailed', (data) => {
        reject(data);
      });
    });
  }, []);

  const authenticate = useCallback(
    async (owner: Address) => {
      setConnectingAccount(undefined);

      let account = await getSmartAccount(owner);

      if (!account) {
        const response = await deploySmartAccount(owner);
        account = response.address;
      }

      if (!account) {
        throw new Error('Failed to deploy smart account');
      }

      console.log('setting connecting account', {
        address: account,
        owner: owner,
      });

      console.log('setting connecting account');
      setConnectingAccount({
        address: account,
        owner: owner,
      });
      // setCurrentRequest(undefined);
    },
    [setConnectingAccount],
  );

  const authorize = useCallback(async () => {
    if (!connectingAccount?.address) {
      throw new Error('No account address found');
    }

    const embeddedUserId = dynamicClient.auth.authenticatedUser?.userId;

    // request nonce
    const nonce = await requestNonce(
      connectingAccount.address,
      partnerId,
      [],
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
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'salt', type: 'string' },
          { name: 'verifyingContract', type: 'string' },
        ],
      },
      primaryType: 'Message',
      // address: account.address,
      message: embeddedUserId
        ? { ...message, userId: embeddedUserId }
        : message,
    };

    const safePayload = safeParseTypedData(signAuth);

    const embeddedWalletClient = (
      await dynamicClient.viem.createWalletClient({
        wallet: dynamicClient.wallets.primary!,
      })
    ).extend(eip712WalletActions());

    // console.log('simpler signature', safePayload.message.content);
    const messageToSign = stableStringify(safePayload.message);
    const signature = await embeddedWalletClient.signMessage({
      message: messageToSign,
    });

    // exchange tokens
    const tokens = await requestToken(
      connectingAccount.address,
      signAuth,
      signature,
      nonce,
      connectingAccount.owner,
    );
    console.log('tokens', tokens);

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

    // await 500 ms to allow react to propagate the change, to remove in the future
    // await new Promise((resolve) => setTimeout(resolve, 500));
  }, [connectingAccount, setAccount, updateAccessToken, updateRefreshToken]);

  const consent = useCallback(async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('No access token found');
    }
    const consentResponse = await requestConsent(accessToken.value, [
      'PERSONALIZATION_ADS',
      'SHARING_DATA',
    ]);

    console.log('consentResponse', consentResponse);

    // force refresh the token so we have the updated consent claims
    await getAccessToken(true);

    sendUIMessage('incomingRpc', {
      id: crypto.randomUUID(),
      requestId: currentRequest!.id,
      content: {
        result: {
          consentAds: true,
          consentData: true,
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
