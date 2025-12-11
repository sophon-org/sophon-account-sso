import { createClient } from '@dynamic-labs/client';
import { ReactNativeExtension } from '@dynamic-labs/react-native-extension';
import { ViemExtension } from '@dynamic-labs/viem-extension';
import {
  type ChainId,
  SophonDynamicEnvironmentID,
} from '@sophon-labs/account-core';

export const createDynamicClient = (
  chainId: ChainId,
  debugMode: boolean = false,
) => {
  return createClient({
    environmentId: SophonDynamicEnvironmentID[chainId],
    appName: 'Sophon Account',
    debug: {
      messageTransport: debugMode,
      webview: debugMode,
    },
  })
    .extend(ReactNativeExtension())
    .extend(ViemExtension());
};

export type DynamicClientType = Awaited<ReturnType<typeof createDynamicClient>>;

export const NoopDynamicClient: DynamicClientType = {
  auth: {
    on: () => {
      return () => {
        return;
      };
    },
    off: () => {
      return () => {
        return;
      };
    },
    email: {
      sendOTP: () => {
        return Promise.resolve();
      },
      verifyOTP: () => {
        return Promise.resolve();
      },
      resendOTP: () => {
        return Promise.resolve();
      },
    },
    social: {
      connect: () => {
        return Promise.resolve();
      },
      getAllLinkedAccounts: () => {
        return Promise.resolve([]);
      },
    },
    logout: () => {
      return Promise.resolve();
    },
    authenticatedUser: null,
  },
  wallets: {
    primary: null,
  },
} as unknown as DynamicClientType;
