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
            return {
              ...context,
              requests: {
                incoming: null,
                typedDataSigning: null,
                messageSigning: null,
                transaction: null,
                session: null,
                authentication: null,
                logout: null,
                consent: null,
              },
            };
          }),
          cancelRequests: assign(({ context }) => {
            if (context.requests.incoming) {
              const signResponse = {
                id: crypto.randomUUID(),
                requestId: context.requests.incoming.id,
                content: {
                  result: null,
                  error: {
                    message: 'User refused the request',
                    code: 4001,
                  },
                },
              };
              windowService.sendMessage(signResponse);
            }

            return {
              ...context,
              requests: {
                incoming: null,
                typedDataSigning: null,
                messageSigning: null,
                transaction: null,
                session: null,
                authentication: null,
                logout: null,
                consent: null,
              },
            };
          }),
          logout: assign(({ context }) => {
            if (context.requests.incoming) {
              const successResponse = {
                id: crypto.randomUUID(),
                requestId: context.requests.incoming.id,
                content: {
                  result: null,
                },
              };
              windowService.sendMessage(successResponse);
            }

            return {
              ...context,
              isAuthenticated: false,
              isLoadingResources: false,
              requests: {
                incoming: null,
                typedDataSigning: null,
                messageSigning: null,
                transaction: null,
                session: null,
                authentication: null,
                logout: null,
                consent: null,
              },
            };
          }),
          clearProfileRequests: assign(({ context }) => {
            if (context.requests.incoming) {
              const successResponse = {
                id: crypto.randomUUID(),
                requestId: context.requests.incoming.id,
                content: {
                  result: [{ eth_accounts: {} }],
                },
              };
              windowService.sendMessage(successResponse);
            }

            return {
              ...context,
              requests: {
                incoming: null,
                typedDataSigning: null,
                messageSigning: null,
                transaction: null,
                session: null,
                authentication: null,
                logout: null,
                consent: null,
              },
            };
          }),
          clearScopes: assign(({ context }) => {
            return {
              ...context,
              scopes: {
                profile: false,
                email: false,
                google: false,
                discord: false,
                telegram: false,
                x: false,
                apple: false,
              },
              partnerId: undefined,
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
