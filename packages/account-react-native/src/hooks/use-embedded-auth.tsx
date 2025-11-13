import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { DataScopes } from '@sophon-labs/account-core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
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
  const { dynamicClient, wcProvider } = useSophonContext();
  const { auth, wallets, viem } = useReactiveClient(dynamicClient);

  const [isWalletModalVisible, setIsWalletModalVisible] = useState(false);
  const connectAbortController = useRef<AbortController | null>(null);

  // Listen for app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // If user comes back to app and modal is visible but still connecting
      if (nextAppState === 'active' && isWalletModalVisible) {
        console.log('🔄 App became active while wallet modal open');
        // Don't close modal, user might want to try again or choose different wallet
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isWalletModalVisible]);

  const signInWithEmail = useCallback(
    async (email: string) => {
      return auth.email.sendOTP(email);
    },
    [auth.email],
  );

  const verifyEmailOTP = useCallback(
    async (token: string) => {
      return auth.email.verifyOTP(token);
    },
    [auth.email],
  );

  const resendEmailOTP = useCallback(async () => {
    return auth.email.resendOTP();
  }, [auth.email]);

  const logout = useCallback(async () => {
    if (wcProvider?.session) {
      await wcProvider.disconnect();
    }
    return auth.logout();
  }, [auth, wcProvider]);

  const signInWithSocialProvider = useCallback(
    async (provider: AuthProvider) => {
      return auth.social.connect({ provider });
    },
    [auth.social],
  );

  const getLinkedAccounts = useCallback(async () => {
    return auth.social.getAllLinkedAccounts();
  }, [auth.social]);

  const connectExternalWallet = useCallback(async () => {
    console.log('🔵 connectExternalWallet called');

    if (!wcProvider) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      console.log('🟡 Opening wallet selection modal...');

      setIsWalletModalVisible(true);

      // Create abort controller for this connection attempt
      connectAbortController.current = new AbortController();
      const { signal } = connectAbortController.current;

      // Start the connection process with timeout
      const connectPromise = wcProvider.connect({
        namespaces: {
          eip155: {
            methods: [
              'eth_sendTransaction',
              'eth_signTransaction',
              'eth_sign',
              'personal_sign',
              'eth_signTypedData',
            ],
            chains: ['eip155:531050204'],
            events: ['chainChanged', 'accountsChanged'],
            rpcMap: {},
          },
        },
      });

      // Add timeout of 5 minutes (user might take time in wallet app)
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeout = setTimeout(
          () => {
            reject(new Error('Connection timeout'));
          },
          5 * 60 * 1000,
        );

        // Clear timeout if aborted
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Connection cancelled'));
        });
      });

      const session = await Promise.race([connectPromise, timeoutPromise]);

      // Close modal on success
      setIsWalletModalVisible(false);

      console.log('🟢 Session created:', session);

      if (!session) {
        throw new Error('Failed to establish WalletConnect session');
      }

      const accounts = (session as any).namespaces?.eip155?.accounts || [];
      if (accounts.length === 0) {
        throw new Error('No accounts connected');
      }

      const addressParts = accounts[0]?.split(':');
      if (!addressParts || addressParts.length < 3) {
        throw new Error('Invalid account format');
      }

      const address = addressParts[2] as Address;
      console.log('✅ Connected wallet address:', address);

      return address;
    } catch (error: any) {
      setIsWalletModalVisible(false);

      // Don't throw error if user cancelled
      if (error.message === 'Connection cancelled') {
        console.log('🔵 User cancelled wallet connection');
        throw new Error('Connection cancelled');
      }

      console.error('❌ WalletConnect connection failed:', error);
      throw error;
    } finally {
      connectAbortController.current = null;
    }
  }, [wcProvider]);

  // Add method to cancel connection
  const cancelWalletConnection = useCallback(() => {
    if (connectAbortController.current) {
      console.log('🛑 Cancelling wallet connection');
      connectAbortController.current.abort();
      setIsWalletModalVisible(false);
    }
  }, []);

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
      }
    }
    return available;
  }, [auth.social, auth.authenticatedUser]);

  const waitForAuthentication = useCallback(async () => {
    return new Promise<Address>((resolve, reject) => {
      wallets.on('primaryChanged', async (data) => {
        if (data?.address) {
          // Poll for wallet client readiness
          let attempts = 0;
          const maxAttempts = 10;

          while (attempts < maxAttempts) {
            try {
              // Try to get wallet client
              const client = await viem.createWalletClient({
                wallet: wallets.primary!,
              });

              if (client) {
                console.log('✅ Wallet client ready');
                resolve(data.address as Address);
                return;
              }
            } catch (e) {
              console.log(
                `⏳ Waiting for wallet client... (${attempts + 1}/${maxAttempts})`,
              );
              await new Promise((r) => setTimeout(r, 500));
              attempts++;
            }
          }

          reject(new Error('Wallet client initialization timeout'));
        } else {
          reject(new Error('No primary wallet found'));
        }
      });

      auth.on('authFailed', (data) => {
        reject(data);
      });
    });
  }, [wallets, auth, viem]);

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
    connectExternalWallet,
    cancelWalletConnection,
    isWalletModalVisible,
    setIsWalletModalVisible,
  };
};
