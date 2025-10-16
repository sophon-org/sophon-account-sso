import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { useCallback } from 'react';
import { dynamicClient } from '../lib/dynamic';

export enum AuthProvider {
  APPLE = 'apple',
  GOOGLE = 'google',
  TWITTER = 'twitter',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
}

export const useEmbeddedAuth = () => {
  const { auth } = useReactiveClient(dynamicClient);

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
  }, [auth.logout]);

  const signInWithSocialProvider = useCallback(
    async (provider: AuthProvider) => {
      return auth.social.connect({ provider });
    },
    [auth.social.connect],
  );

  const getLinkedAccounts = useCallback(async () => {
    return auth.social.getAllLinkedAccounts();
  }, [auth.social.getAllLinkedAccounts]);

  return {
    signInWithSocialProvider,
    getLinkedAccounts,
    signInWithEmail,
    verifyEmailOTP,
    resendEmailOTP,
    logout,
  };
};
