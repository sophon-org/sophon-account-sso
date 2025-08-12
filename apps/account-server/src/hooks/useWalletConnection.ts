'use client';
import { useCallback, useEffect } from 'react';
import type { Address } from 'viem';
import {
  useAccount,
  useAccountEffect,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useWalletClient,
} from 'wagmi';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { env } from '@/env';
import { sendMessage } from '@/events';
import {
  trackAuthCompleted,
  trackAuthFailed,
  trackAuthStarted,
  updateUserProperties,
} from '@/lib/analytics';
import { useAccountCreate } from './useAccountCreate';

export const useWalletConnection = () => {
  const { address, isConnected, isConnecting, chainId } = useAccount();
  const { connectAsync, connectors, error, isPending, isSuccess } =
    useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const { success: accountCreated } = useAccountCreate();
  const { switchChain } = useSwitchChain();
  const actorRef = MainStateMachineContext.useActorRef();

  useAccountEffect({
    onConnect(data: { address: Address }) {
      sendMessage('k1.login', {
        address: data.address,
      });

      // Update user properties with wallet info
      updateUserProperties({
        wallet_address: data.address,
        wallet_connected_at: new Date().toISOString(),
        authMethod: 'wallet',
      });
    },
    onDisconnect() {
      console.log('Disconnected!');
      updateUserProperties({
        wallet_disconnected_at: new Date().toISOString(),
      });
    },
  });

  const connectWallet = useCallback(
    async (connectorName: string) => {
      try {
        trackAuthStarted('wallet');

        if (!isConnected) {
          const connector = connectors.find((c) => c.name === connectorName);
          if (connector) {
            await connectAsync({ connector });
            trackAuthCompleted('wallet');

            // Update user properties with wallet type
            updateUserProperties({
              walletType: connectorName,
              last_wallet_used: connectorName,
            });
          }
        } else {
          sendMessage('k1.login', {
            address: address!,
          });
          trackAuthCompleted('wallet');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        if (
          error instanceof Error &&
          error.message.includes('User rejected the request')
        ) {
          trackAuthFailed(
            'wallet',
            'User rejected the request',
            'wallet_connection',
          );
          actorRef.send({ type: 'ACCOUNT_ERROR' });
          actorRef.send({ type: 'WALLET_SELECTION' });
        } else {
          trackAuthFailed('wallet', errorMessage, 'wallet_connection');
          console.error('❌ Wallet connection failed:', error);
        }
      }
    },
    [connectors, isConnected, address, connectAsync, actorRef],
  );

  const handleCreateAccount = useCallback(async () => {
    if (chainId && chainId !== env.NEXT_PUBLIC_CHAIN_ID) {
      actorRef.send({ type: 'WRONG_NETWORK' });
      return;
    }
    if (isSuccess && walletClient && address) {
      sendMessage('k1.login', {
        address: address!,
      });
    }
  }, [chainId, isSuccess, walletClient, address, actorRef]);

  const handleSwitchChain = async () => {
    if (chainId && chainId !== env.NEXT_PUBLIC_CHAIN_ID) {
      switchChain({ chainId: env.NEXT_PUBLIC_CHAIN_ID });
    }
  };

  useEffect(() => {
    handleCreateAccount();
  }, [handleCreateAccount]);

  // useEffect(() => {
  //   if (accountCreated && address) {
  //     handleAuthSuccessResponse(
  //       { address: address },
  //       incomingRequest!,
  //       sessionPreferences,
  //     );
  //     setState?.(AuthState.AUTHENTICATED);
  //   }
  // }, [accountCreated, address]);

  return {
    address,
    isConnected,
    isConnecting,
    connectWallet,
    disconnect,
    error,
    isPending,
    accountCreated,
    handleSwitchChain,
  };
};
