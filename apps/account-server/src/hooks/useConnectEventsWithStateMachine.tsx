'use client';

import { useEffect } from 'react';
import { useLoadingResources } from '@/hooks/useLoadingResources';
import { MainStateMachineContext } from '../context/state-machine-context';

export const useConnectEventsWithStateMachine = () => {
  const actorRef = MainStateMachineContext.useActorRef();
  const state = MainStateMachineContext.useSelector((state) => state);

  const {
    incomingRequest,
    sessionPreferences,
    signingRequest,
    transactionRequest,
  } = useLoadingResources();

  useEffect(() => {
    actorRef.send({
      type: 'PUSH_REQUEST',
      requests: {
        incoming: incomingRequest,
        session: sessionPreferences,
        signing: signingRequest,
        transaction: transactionRequest,
      },
    });
  }, [
    incomingRequest,
    sessionPreferences,
    signingRequest,
    transactionRequest,
    actorRef,
  ]);

  useEffect(() => {
    console.log('>>> current state: ', state.value, state.context);
  }, [state]);
};
