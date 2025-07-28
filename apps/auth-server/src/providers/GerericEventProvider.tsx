'use client';

import { useK1LoginHandler } from '@/hooks/handlers/useK1LoginHandler';
import { useK1LoginInitHandler } from '@/hooks/handlers/useK1LoginInitHandler';
import { useK1LogoutHandler } from '@/hooks/handlers/useK1LogoutHandler';
import { useSmartContractLogoutHandler } from '@/hooks/handlers/useSmartContractLogoutHandler';
import { useConnectEventsWithStateMachine } from '@/hooks/useConnectEventsWithStateMachine';

export const GenericEventProvider = () => {
  useConnectEventsWithStateMachine();

  useK1LoginInitHandler();
  useK1LoginHandler();
  useK1LogoutHandler();
  useSmartContractLogoutHandler();

  return null;
};
