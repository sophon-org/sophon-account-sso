'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { MainStateMachineContext } from '@/context/state-machine-context';
import {
  clearSocialProviderFromURL,
  getSocialProviderFromURL,
} from '@/lib/social-provider';
import { useAccountContext } from './useAccountContext';
import { useMessageHandler } from './useMessageHandler';
import { useStatus } from '@openfort/react';

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


  // validate the sdk status on openfort before continuing
  const { isLoading } = useStatus();
  const sdkHasLoaded = !isLoading;

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
      const isConnectedOnProvider = isConnectedWagmi;
      const isAuthenticated = !!account && isConnectedOnProvider;

      // Handling for OAuth returns - prevent UI flicker
      // Wait for both primaryWallet AND account to be ready, unless timeout occurred
      if (
        isReturningFromOAuth &&
        (!account || !smartAccountDeployed) &&
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
