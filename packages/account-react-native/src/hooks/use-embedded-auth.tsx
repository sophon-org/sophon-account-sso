// import { useReactiveClient } from '@dynamic-labs/react-hooks';

import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { DataScopes } from '@sophon-labs/account-core';
import { useCallback, useEffect, useMemo } from 'react';
import type { Address } from 'viem';
import { toAccount } from 'viem/accounts';
import { eip712WalletActions } from 'viem/zksync';
import { useSophonContext } from '.';

export enum AuthProvider {
  APPLE = 'apple',
  GOOGLE = 'google',
  TWITTER = 'twitter',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
}

const SOCIAL_AUTH_TIMEOUT = 2 * 60 * 1000;

export const useEmbeddedAuth = () => {
  const { dynamicClient } = useSophonContext();
  const { auth, wallets, viem } = useReactiveClient(dynamicClient);

  const signInWithEmail = useCallback(
    async (email: string) => {
      if (auth.authenticatedUser) {
        await auth.logout();
      }

      return auth.email.sendOTP(email);
    },
    [auth.email.sendOTP, auth.authenticatedUser, auth.logout],
  );

  const verifyEmailOTP = useCallback(
    async (token: string) => {
      return auth.email.verifyOTP(token);
    },
    [auth.email.verifyOTP],
  );

  const resendEmailOTP = useCallback(async () => {
    return auth.email.resendOTP();
  }, [auth.email.resendOTP]);

  const logout = useCallback(async () => {
    return auth.logout();
  }, [auth]);

  const signInWithSocialProvider = useCallback(
    async (provider: AuthProvider) => {
      if (auth.authenticatedUser) {
        await auth.logout();
      }

      return auth.social.connect({ provider });
    },
    [auth.social.connect, auth.authenticatedUser, auth.logout],
  );

  const getLinkedAccounts = useCallback(async () => {
    return auth.social.getAllLinkedAccounts();
  }, [auth.social.getAllLinkedAccounts]);

  const isConnected = useMemo(() => {
    return auth.authenticatedUser !== null;
  }, [auth.authenticatedUser]);

  const getAvailableDataScopes = useCallback(async () => {
    const available: DataScopes[] = [];
    if (auth.authenticatedUser?.email) {
      available.push(DataScopes.email);
    }

    const socials = await auth.social.getAllLinkedAccounts();
    for (const social of socials ?? []) {
      switch (social.provider) {
        case 'google':
          available.push(DataScopes.google);
          break;
        case 'twitter':
          available.push(DataScopes.x);
          break;
        case 'discord':
          available.push(DataScopes.discord);
          break;
        case 'telegram':
          available.push(DataScopes.telegram);
          break;
        case 'apple':
          available.push(DataScopes.apple);
          break;
        default:
        // do nothing on unmapped providers
      }
    }

    return available;
  }, [auth.social.getAllLinkedAccounts, auth.authenticatedUser]);

  const waitForAuthentication = useCallback(async () => {
    return new Promise<Address>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Authentication timed out, please try again.'));
      }, SOCIAL_AUTH_TIMEOUT);

      wallets.on('primaryChanged', (data) => {
        clearTimeout(timeout);
        if (data?.address) {
          resolve(data.address as Address);
        } else {
          reject(new Error('No primary wallet found'));
        }
      });

      auth.on('authFailed', (data) => {
        clearTimeout(timeout);
        reject(data);
      });
    });
  }, [wallets, auth]);

  const embeddedUserId = useMemo(() => {
    return auth.authenticatedUser?.userId;
  }, [auth.authenticatedUser]);

  const createEmbeddedWalletClient = useCallback(async () => {
    return (
      await viem.createWalletClient({
        wallet: wallets.primary!,
      })
    ).extend(eip712WalletActions());
  }, [viem, wallets.primary]);

  useEffect(() => {
    dynamicClient.auth.on('authFailed', (data) => {
      console.log('🚨 authFailed:', data);
    });
  }, [dynamicClient]);

  const createEmbeddedAccountSigner = useCallback(async () => {
    const walletClient = await viem.createWalletClient({
      wallet: wallets.primary!,
    });

    // Wrap it as a viem account (signer interface)
    return toAccount({
      address: wallets.primary!.address as Address,
      async signMessage({ message }) {
        const result = await walletClient.signMessage({
          message,
          account: wallets.primary!.address as Address,
        });
        return result;
      },
      async signTransaction(transaction) {
        // @ts-expect-error - Type mismatch between viem account interface and wallet client
        const result = await walletClient.signTransaction(transaction);
        return result;
      },
      async signTypedData(typedData) {
        try {
          // @ts-expect-error - Type mismatch between viem account interface and wallet client
          const result = await walletClient.signTypedData(...typedData, {
            account: wallets.primary!.address as Address,
          });
          return result;
        } catch (error) {
          console.error('Failed to sign typed data', error);
          throw error;
        }
      },
    });
  }, [viem, wallets.primary]);

  return {
    signInWithSocialProvider,
    getLinkedAccounts,
    signInWithEmail,
    verifyEmailOTP,
    resendEmailOTP,
    logout,
    getAvailableDataScopes,
    isConnected,
    waitForAuthentication,
    embeddedUserId,
    createEmbeddedWalletClient,
    createEmbeddedAccountSigner,
  };
};
