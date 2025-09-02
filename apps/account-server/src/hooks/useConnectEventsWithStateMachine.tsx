'use client';

import { useEffect } from 'react';
import { useLoadingResources } from '@/hooks/useLoadingResources';
import { MainStateMachineContext } from '../context/state-machine-context';

export const useConnectEventsWithStateMachine = () => {
  const actorRef = MainStateMachineContext.useActorRef();

  const {
    incomingRequest,
    sessionPreferences,
    typedDataSigningRequest,
    messageSigningRequest,
    transactionRequest,
    authenticationRequest,
    logoutRequest,
  } = useLoadingResources();

  useEffect(() => {
    actorRef.send({
      type: 'PUSH_REQUEST',
      requests: {
        incoming: incomingRequest,
        session: sessionPreferences,
        typedDataSigning: typedDataSigningRequest,
        messageSigning: messageSigningRequest,
        transaction: transactionRequest,
        authentication: authenticationRequest,
        logout: logoutRequest,
      },
    });
  }, [
    incomingRequest,
    sessionPreferences,
    typedDataSigningRequest,
    messageSigningRequest,
    transactionRequest,
    authenticationRequest,
    logoutRequest,
    actorRef,
  ]);
};
