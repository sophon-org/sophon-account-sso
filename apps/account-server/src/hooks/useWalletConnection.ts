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
import { useAccountCreate } from './useAccountCreate';

export const useWalletConnection = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error, isPending, isSuccess } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const { success: accountCreated } = useAccountCreate();
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const actorRef = MainStateMachineContext.useActorRef();

  useAccountEffect({
    onConnect(data: { address: Address }) {
      sendMessage('k1.login', {
        address: data.address,
      });
    },
    onDisconnect() {
      console.log('Disconnected!');
    },
  });

  const connectWallet = useCallback(
    async (connectorName: string) => {
      try {
        if (!isConnected) {
          const connector = connectors.find((c) => c.name === connectorName);
          if (connector) {
            connect({ connector });
          }
        } else {
          sendMessage('k1.login', {
            address: address!,
          });
        }
      } catch (error) {
        console.error('❌ Wallet connection failed:', error);
      }
    },
    [connectors, isConnected, address, connect],
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
