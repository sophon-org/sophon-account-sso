'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAccountContext } from './useAccountContext';
import { useMessageHandler } from './useMessageHandler';

export const useLoadingResources = () => {
  const actorRef = MainStateMachineContext.useActorRef();

  const {
    incomingRequest,
    sessionPreferences,
    typedDataSigningRequest,
    messageSigningRequest,
    transactionRequest,
    authenticationRequest,
    logoutRequest,
    handlerInitialized,
  } = useMessageHandler();

  const { account } = useAccountContext();
  const { isConnected: isConnectedWagmi } = useAccount();

  // Setup Dynamic Listening so we make sure that we got all the information before following up with the state machine
  const { sdkHasLoaded, primaryWallet } = useDynamicContext();
  useEffect(() => {
    if (sdkHasLoaded && handlerInitialized) {
      // important to ensure that we are connected to the provider, some providers may
      // just disconnect the user after some idle time
      const isConnectedOnProvider = !!primaryWallet || isConnectedWagmi;
      const isAuthenticated = !!account && isConnectedOnProvider;
      actorRef.send({
        type: 'RESOURCES_LOADED',
        authenticated: isAuthenticated,
      });
    }
  }, [
    sdkHasLoaded,
    actorRef,
    handlerInitialized,
    account,
    primaryWallet,
    isConnectedWagmi,
  ]);

  return {
    incomingRequest,
    sessionPreferences,
    typedDataSigningRequest,
    messageSigningRequest,
    transactionRequest,
    authenticationRequest,
    logoutRequest,
  };
};
