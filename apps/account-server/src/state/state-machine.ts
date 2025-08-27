import { assign, createMachine } from 'xstate';
import type {
  AuthenticationRequest,
  IncomingRequest,
  LogoutRequest,
  MessageSigningRequest,
  TransactionRequest,
  TypedDataSigningRequest,
} from '@/types/auth';
import type { Scopes } from '@/types/data-scopes';

const defaultContext = {
  error: undefined as string | undefined,
  isLoadingResources: true as boolean,
  isAuthenticated: false as boolean,
  email: undefined as string | undefined,
  requests: {
    incoming: null as IncomingRequest | null | undefined,
    session: null as undefined | null,
    typedDataSigning: null as TypedDataSigningRequest | null | undefined,
    messageSigning: null as MessageSigningRequest | null | undefined,
    transaction: null as TransactionRequest | null | undefined,
    authentication: null as AuthenticationRequest | null | undefined,
    logout: null as LogoutRequest | null | undefined,
  },
  scopes: {
    profile: false,
    email: false,
    google: false,
    discord: false,
    telegram: false,
    x: false,
  } as Record<Scopes, boolean>,
  partnerId: undefined as string | undefined,
  isWalletConnectActive: false as boolean,
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
    SET_ACCEPTED_SCOPES: {
      actions: assign(({ context, event }) => {
        return {
          ...context,
          scopes: {
            ...context.scopes,
            ...event.scopes,
          },
          partnerId: event.partnerId,
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
              actions: assign({
                email: ({ event }) => event.email,
              }),
            },
          },
        },
        selectEOAWallet: {
          on: {
            CANCEL: {
              target: '#userWalletRequestStateMachine.completed',
              actions: 'clearRequests',
            },
            GO_BACK: {
              target: 'idle',
            },
            WALLET_SELECTED: {
              target: 'started',
            },
            WALLET_CONNECT_SELECTED: {
              actions: assign({ isWalletConnectActive: true }),
            },
            WALLET_CONNECT_CANCELLED: {
              actions: assign({ isWalletConnectActive: false }),
            },
          },
        },
        waitForEmailOTP: {
          on: {
            CANCEL: {
              target: '#userWalletRequestStateMachine.completed',
              actions: 'clearRequests',
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
            return (
              context.isAuthenticated && !!context.requests.typedDataSigning
            );
          },
          target: 'incoming-typed-data-signature',
        },
        {
          guard: ({ context }) => {
            return context.isAuthenticated && !!context.requests.messageSigning;
          },
          target: 'incoming-message-signature',
        },
        {
          guard: ({ context }) => {
            return context.isAuthenticated && !!context.requests.transaction;
          },
          target: 'incoming-transaction',
        },
        {
          guard: ({ context }) => {
            return context.isAuthenticated && !!context.requests.authentication;
          },
          target: 'incoming-authentication',
          actions: ['clearScopes'],
        },
        {
          guard: ({ context }) => {
            return !!context.requests.logout;
          },
          target: 'incoming-logout',
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
    'incoming-typed-data-signature': {
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
    'incoming-message-signature': {
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
    'incoming-logout': {
      on: {
        ACCEPT: {
          target: 'completed',
          actions: 'clearRequests',
        },
        CANCEL: {
          target: 'completed',
          actions: 'clearRequests',
        },
        LOGOUT: {
          target: 'login-required',
          actions: [
            'clearRequests',
            assign(({ context }) => ({
              ...context,
              isAuthenticated: false,
              isLoadingResources: false,
            })),
          ],
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
