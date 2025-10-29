// import { useReactiveClient } from '@dynamic-labs/react-hooks';

import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { DataScopes } from '@sophon-labs/account-core';
import { useCallback, useEffect, useMemo } from 'react';
import type { Address } from 'viem';
import { eip712WalletActions } from 'viem/zksync';
import { useSophonContext } from '.';

export enum AuthProvider {
  APPLE = 'apple',
  GOOGLE = 'google',
  TWITTER = 'twitter',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
}

export const useEmbeddedAuth = () => {
  const { dynamicClient } = useSophonContext();
  const { auth, wallets, viem } = useReactiveClient(dynamicClient);

  const signInWithEmail = useCallback(
    async (email: string) => {
      return auth.email.sendOTP(email);
    },
    [auth.email.sendOTP],
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
      return auth.social.connect({ provider });
    },
    [auth.social.connect],
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
      wallets.on('primaryChanged', (data) => {
        if (data?.address) {
          resolve(data.address as Address);
        } else {
          reject(new Error('No primary wallet found'));
        }
      });

      auth.on('authFailed', (data) => {
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
  };
};
