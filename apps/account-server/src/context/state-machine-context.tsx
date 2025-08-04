'use client';

import { createActorContext } from '@xstate/react';
import { assign } from 'xstate';
import { sendMessage } from '@/events';
import { useAccountContext } from '@/hooks/useAccountContext';
import { windowService } from '@/service/window.service';
import { userWalletRequestStateMachine } from '@/state/state-machine';

export const MainStateMachineContext = createActorContext(
  userWalletRequestStateMachine,
);

export const MainStateMachineContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { account } = useAccountContext();

  return (
    <MainStateMachineContext.Provider
      logic={userWalletRequestStateMachine.provide({
        guards: {
          isAuthenticated: () => {
            return !!account;
          },
          isNotAuthenticated: () => {
            return !account;
          },
        },
        actions: {
          clearRequests: assign(({ context }) => {
            if (context.requests.incoming) {
              const signResponse = {
                id: crypto.randomUUID(),
                requestId: context.requests.incoming.id,
                content: {
                  result: null,
                  error: {
                    message: 'User refused the request.',
                    code: -32002,
                  },
                },
              };
              windowService.sendMessage(signResponse);
            }

            return {
              ...context,
              requests: {
                incoming: null,
                signing: null,
                transaction: null,
                session: null,
                authentication: null,
              },
            };
          }),
          finishFlow: () => {
            windowService.close();
            sendMessage('flow.complete', null);
          },
        },
      })}
    >
      {children}
    </MainStateMachineContext.Provider>
  );
};
