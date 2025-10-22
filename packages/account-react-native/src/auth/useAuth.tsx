// import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { DataScopes } from '@sophon-labs/account-core';
import { useCallback, useMemo } from 'react';
import type { Address } from 'viem';
import { eip712WalletActions } from 'viem/zksync';
import { useSophonContext } from '../hooks';

export enum AuthProvider {
  APPLE = 'apple',
  GOOGLE = 'google',
  TWITTER = 'twitter',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
}

export const useEmbeddedAuth = () => {
  const { dynamicClient } = useSophonContext();
  // const auth = useMemo(() => dynamicClient, [dynamicClient]);

  // const { auth } = useReactiveClient(
  //   dynamicClient ?? {
  //     auth: {
  //       mocked: true,
  //       authenticatedUser: null,
  //       email: {
  //         sendOTP: () => Promise.resolve(),
  //         verifyOTP: () => Promise.resolve(),
  //         resendOTP: () => Promise.resolve(),
  //       },
  //       social: {
  //         connect: () => Promise.resolve(),
  //         getAllLinkedAccounts: () => Promise.resolve(),
  //       },
  //       logout: () => Promise.resolve(),
  //     },
  //   },
  // );

  const signInWithEmail = useCallback(
    async (email: string) => {
      return dynamicClient?.auth.email.sendOTP(email);
    },
    [dynamicClient?.auth.email.sendOTP],
  );

  const verifyEmailOTP = useCallback(
    async (token: string) => {
      return dynamicClient?.auth.email.verifyOTP(token);
    },
    [dynamicClient?.auth.email.verifyOTP],
  );

  const resendEmailOTP = useCallback(async () => {
    return dynamicClient?.auth.email.resendOTP();
  }, [dynamicClient?.auth.email.resendOTP]);

  const logout = useCallback(async () => {
    return dynamicClient?.auth.logout();
  }, [dynamicClient?.auth.logout]);

  const signInWithSocialProvider = useCallback(
    async (provider: AuthProvider) => {
      return dynamicClient?.auth.social.connect({ provider });
    },
    [dynamicClient?.auth.social.connect],
  );

  const getLinkedAccounts = useCallback(async () => {
    return dynamicClient?.auth.social.getAllLinkedAccounts();
  }, [dynamicClient?.auth.social.getAllLinkedAccounts]);

  const isConnected = useMemo(() => {
    return dynamicClient?.auth.authenticatedUser !== null;
  }, [dynamicClient?.auth.authenticatedUser]);

  const getAvailableDataScopes = useCallback(async () => {
    const available: DataScopes[] = [];
    if (dynamicClient?.auth.authenticatedUser?.email) {
      available.push(DataScopes.email);
    }

    const socials = await dynamicClient?.auth.social.getAllLinkedAccounts();
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
  }, [
    dynamicClient?.auth.social.getAllLinkedAccounts,
    dynamicClient?.auth.authenticatedUser,
  ]);

  const waitForAuthentication = useCallback(async () => {
    return new Promise<Address>((resolve, reject) => {
      dynamicClient?.wallets.on('primaryChanged', (data) => {
        console.log('primaryChanged', data);

        if (data?.address) {
          resolve(data.address as Address);
        } else {
          reject(new Error('No primary wallet found'));
        }
      });

      dynamicClient?.auth.on('authFailed', (data) => {
        reject(data);
      });
    });
  }, [dynamicClient?.wallets, dynamicClient?.auth]);

  const embeddedUserId = useMemo(() => {
    return dynamicClient?.auth.authenticatedUser?.userId;
  }, [dynamicClient?.auth.authenticatedUser]);

  const createEmbeddedWalletClient = useCallback(async () => {
    return (
      await dynamicClient!.viem.createWalletClient({
        wallet: dynamicClient!.wallets.primary!,
      })
    ).extend(eip712WalletActions());
  }, [dynamicClient?.viem, dynamicClient?.wallets.primary]);

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
