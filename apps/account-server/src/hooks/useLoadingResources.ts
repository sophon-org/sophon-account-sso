'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useEffect } from 'react';
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
    handlerInitialized,
  } = useMessageHandler();

  const { account } = useAccountContext();

  // Setup Dynamic Listening so we make sure that we got all the information before following up with the state machine
  const { sdkHasLoaded } = useDynamicContext();
  useEffect(() => {
    if (sdkHasLoaded && handlerInitialized) {
      actorRef.send({ type: 'RESOURCES_LOADED', authenticated: !!account });
    }
  }, [sdkHasLoaded, actorRef, handlerInitialized, account]);

  return {
    incomingRequest,
    sessionPreferences,
    typedDataSigningRequest,
    messageSigningRequest,
    transactionRequest,
    authenticationRequest,
  };
};
