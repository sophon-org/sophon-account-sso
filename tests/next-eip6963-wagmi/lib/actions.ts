'use client';

import * as wagmiActions from 'wagmi/actions';
import { wagmiConfig } from './wagmi';

// biome-ignore lint/suspicious/noExplicitAny: ignore for sake of dynamic testing
export const testableActions = { ...wagmiActions } as any;
export type TestableActionsNames = keyof typeof wagmiActions;
export const totalTestableActions = Object.keys(testableActions).length;

export const executeWagmiAction = async <T extends TestableActionsNames>(
  action: T,
  args: Parameters<(typeof wagmiActions)[T]>[1],
): Promise<ReturnType<(typeof wagmiActions)[T]>> => {
  return await testableActions[action](wagmiConfig, args);
};

if (typeof window !== 'undefined') {
  window.executeWagmiAction = executeWagmiAction;
}

declare global {
  interface Window {
    executeWagmiAction: (
      action: TestableActionsNames,
      // biome-ignore lint/suspicious/noExplicitAny: ignore for sake of dynamic testing
      args: any,
    ) => Promise<unknown>;
  }
}
