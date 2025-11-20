'use client';
import { useCallback, useEffect } from 'react';
import type { Address } from 'viem';
import { sophonTestnet } from 'viem/chains';
import {
  type Connector,
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
  const actorRef = MainStateMachineContext.useActorRef();
  const { switchChain } = useSwitchChain();

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

  const handleCheckChainId = useCallback(async (connector: Connector) => {
    try {
      const chainId = await connector.getChainId();
      if (chainId !== env.NEXT_PUBLIC_CHAIN_ID) {
        if (connector.switchChain) {
          await connector.switchChain({ chainId: env.NEXT_PUBLIC_CHAIN_ID });
        } else {
          throw new Error(
            `Please switch to ${
              env.NEXT_PUBLIC_CHAIN_ID === sophonTestnet.id
                ? 'Sophon Testnet'
                : 'Sophon Mainnet'
            } network manually`,
          );
        }
      }
    } catch (error) {
      console.error('Chain switching failed:', error);
      throw error;
    }
  }, []);

  const connectWallet = useCallback(
    async (connectorName: string) => {
      try {
        trackAuthStarted('wallet');

        if (!isConnected) {
          const connector = connectors.find((c) => c.name === connectorName);
          if (connector) {
            await handleCheckChainId(connector);

            // Check if the connector is already connected after switching
            try {
              await connectAsync({ connector });
            } catch (connectError) {
              if (
                connectError instanceof Error &&
                connectError.message?.includes('already connected')
              ) {
                console.log('Connector already connected, proceeding...');
              } else {
                throw connectError;
              }
            }

            trackAuthCompleted('wallet');

            // Send login message since onConnect callback won't fire for already connected wallets
            sendMessage('k1.login', {
              address: address!,
            });

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
    [
      connectors,
      isConnected,
      address,
      connectAsync,
      actorRef,
      handleCheckChainId,
    ],
  );

  const handleCreateAccount = useCallback(async () => {
    if (isSuccess && walletClient && address) {
      sendMessage('k1.login', {
        address: address!,
      });
    }
  }, [isSuccess, walletClient, address]);

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
    handleCheckChainId,
    handleSwitchChain,
  };
};
