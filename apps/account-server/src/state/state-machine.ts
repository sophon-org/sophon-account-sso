import { assign, createMachine } from 'xstate';
import type {
  IncomingRequest,
  SigningRequest,
  TransactionRequest,
} from '@/types/auth';

const defaultContext = {
  error: undefined as string | undefined,
  isLoadingResources: true as boolean,
  isAuthenticated: false as boolean,
  requests: {
    incoming: null as IncomingRequest | null | undefined,
    session: null as unknown | null | undefined,
    signing: null as SigningRequest | null | undefined,
    transaction: null as TransactionRequest | null | undefined,
  },
};

export const userWalletRequestStateMachine = createMachine({
  id: 'userWalletRequestStateMachine',
  initial: 'loading',
  schemas: {
    context: typeof defaultContext,
  },
  context: defaultContext,
  on: {
    PUSH_REQUEST: {
      actions: assign(({ context, event }) => {
        return {
          ...context,
          requests: event.requests ?? {},
        };
      }),
    },
    RESOURCES_LOADED: {
      actions: assign(({ context, event }) => {
        return {
          ...context,
          isLoadingResources: false,
          isAuthenticated: event.authenticated,
        };
      }),
    },
    SET_ERROR: {
      actions: assign(({ context, event }) => {
        return {
          ...context,
          error: event.error,
        };
      }),
    },
    CLEAR_ERROR: {
      actions: assign(({ context }) => {
        return {
          ...context,
          error: undefined,
        };
      }),
    },
    CANCEL: {
      target: '#userWalletRequestStateMachine.completed',
      actions: 'clearRequests',
    },
  },
  states: {
    loading: {
      always: [
        {
          guard: ({ context }) => {
            return (
              !context.isLoadingResources &&
              !!context.requests.incoming &&
              context.isAuthenticated
            );
          },
          target: 'incoming-request',
        },
        {
          guard: ({ context }) => {
            return !context.isLoadingResources && !context.isAuthenticated;
          },
          target: 'login-required',
        },
        {
          guard: ({ context }) => {
            return !context.isLoadingResources && context.isAuthenticated;
          },
          target: 'profile',
        },
      ],
    },
    'login-required': {
      initial: 'idle',
      states: {
        idle: {
          always: [
            {
              guard: ({ context }) => {
                return context.isAuthenticated;
              },
              target: 'complete',
            },
          ],
          on: {
            AUTHENTICATION_STARTED: {
              target: 'started',
            },
            WALLET_SELECTION: {
              target: 'selectEOAWallet',
            },
            OTP_SENT: {
              target: 'waitForEmailOTP',
            },
          },
        },
        selectEOAWallet: {
          on: {
            CANCEL: {
              target: 'idle',
            },
            WALLET_SELECTED: {
              target: 'started',
            },
          },
        },
        waitForEmailOTP: {
          on: {
            CANCEL: {
              target: 'idle',
            },
            OTP_VERIFIED: {
              target: 'started',
            },
          },
        },
        started: {
          on: {
            ACCOUNT_AUTHENTICATED: {
              target: 'deployment',
            },
            ACCOUNT_ERROR: {
              target: 'idle',
            },
          },
        },
        deployment: {
          on: {
            LOGIN_SUCCESS: {
              target: 'complete',
            },
          },
        },
        complete: {
          type: 'final',
        },
      },
      onDone: [
        {
          target: 'profile',
          guard: ({ context }) => {
            return !context.requests.incoming;
          },
        },
        {
          target: 'incoming-request',
          guard: ({ context }) => {
            return !!context.requests.incoming;
          },
        },
      ],
    },
    'wrong-network': {
      on: {
        SWITCH_NETWORK: {
          target: 'profile',
        },
      },
    },
    profile: {
      always: [
        {
          guard: ({ context }) => {
            return context.isAuthenticated && !!context.requests.incoming;
          },
          target: 'incoming-request',
        },
        {
          guard: ({ context }) => {
            return !context.isAuthenticated;
          },
          target: 'login-required',
        },
      ],
      on: {
        LOGOUT: {
          target: 'login-required',
        },
      },
    },
    'incoming-request': {
      always: [
        {
          guard: ({ context }) => {
            return !context.isAuthenticated;
          },
          target: 'login-required',
        },
        {
          guard: ({ context }) => {
            return context.isAuthenticated && !!context.requests.signing;
          },
          target: 'incoming-signature',
        },
        {
          guard: ({ context }) => {
            return context.isAuthenticated && !!context.requests.transaction;
          },
          target: 'incoming-transaction',
        },
        {
          guard: ({ context }) => {
            return (
              context.isAuthenticated &&
              !!context.requests.incoming &&
              !context.requests.signing &&
              !context.requests.transaction
            );
          },
          target: 'incoming-authentication',
        },
      ],
    },
    'incoming-authentication': {
      on: {
        ACCEPT: {
          target: 'completed',
          actions: 'clearRequests',
        },
        CANCEL: {
          target: 'completed',
          actions: 'clearRequests',
        },
      },
    },
    'incoming-signature': {
      on: {
        ACCEPT: {
          target: 'completed',
          actions: 'clearRequests',
        },
        CANCEL: {
          target: 'completed',
          actions: 'clearRequests',
        },
      },
    },
    'incoming-transaction': {
      on: {
        ACCEPT: {
          target: 'completed',
          actions: 'clearRequests',
        },
        CANCEL: {
          target: 'completed',
          actions: 'clearRequests',
        },
      },
    },
    completed: {
      always: {
        target: 'loading',
        actions: 'finishFlow',
      },
    },
  },
});
