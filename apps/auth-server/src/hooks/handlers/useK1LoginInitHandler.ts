'use client';

import { MainStateMachineContext } from '@/context/state-machine-context';
import { useEventHandler } from '@/events/hooks';

export const useK1LoginInitHandler = () => {
  const actorRef = MainStateMachineContext.useActorRef();

  useEventHandler('k1.login.init', () => {
    actorRef.send({ type: 'AUTHENTICATION_STARTED' });
  });
};
