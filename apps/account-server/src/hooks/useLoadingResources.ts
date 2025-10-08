'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { MainStateMachineContext } from '@/context/state-machine-context';
import {
  clearSocialProviderFromURL,
  getSocialProviderFromURL,
} from '@/lib/social-provider';
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
    consentRequest,
    logoutRequest,
    handlerInitialized,
  } = useMessageHandler();

  const { account, smartAccountDeployed } = useAccountContext();
  const { isConnected: isConnectedWagmi } = useAccount();
  const socialProvider = getSocialProviderFromURL();
  const isReturningFromOAuth = !!socialProvider;
  const [oauthTimeout, setOauthTimeout] = useState(false);

  // Setup Dynamic Listening so we make sure that we got all the information before following up with the state machine
  const { sdkHasLoaded, primaryWallet } = useDynamicContext();

  // This ensures we don't get stuck if primaryWallet or account never load
  // Extended timeout of 15 seconds so we can also cover account deployment
  useEffect(() => {
    if (isReturningFromOAuth) {
      const timeout = setTimeout(() => setOauthTimeout(true), 15000);
      return () => clearTimeout(timeout);
    }
  }, [isReturningFromOAuth]);

  useEffect(() => {
    if (sdkHasLoaded && handlerInitialized) {
      // important to ensure that we are connected to the provider, some providers may
      // just disconnect the user after some idle time
      const isConnectedOnProvider = !!primaryWallet || isConnectedWagmi;
      const isAuthenticated = !!account && isConnectedOnProvider;

      // Handling for OAuth returns - prevent UI flicker
      // Wait for both primaryWallet AND account to be ready, unless timeout occurred
      if (
        isReturningFromOAuth &&
        (!primaryWallet || !account || !smartAccountDeployed) &&
        !oauthTimeout
      ) {
        return; // Skip this cycle, wait for resources to load
      }

      if (isAuthenticated) {
        // User is authenticated
        actorRef.send({
          type: 'RESOURCES_LOADED',
          authenticated: true,
        });

        // Clean up OAuth URL parameter after successful authentication
        if (isReturningFromOAuth) {
          clearSocialProviderFromURL();
        }
      } else {
        // User is not authenticated - show login screen
        actorRef.send({
          type: 'RESOURCES_LOADED',
          authenticated: false,
        });
      }
    }
  }, [
    sdkHasLoaded,
    actorRef,
    handlerInitialized,
    account,
    primaryWallet,
    isConnectedWagmi,
    isReturningFromOAuth,
    oauthTimeout,
    smartAccountDeployed,
  ]);

  return {
    incomingRequest,
    sessionPreferences,
    typedDataSigningRequest,
    messageSigningRequest,
    transactionRequest,
    authenticationRequest,
    logoutRequest,
    consentRequest,
  };
};
