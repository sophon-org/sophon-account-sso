import type { Wallet } from '@dynamic-labs/sdk-react-core';
import type { Address } from 'viem';

/*
 * Defines the actions and payloads available for the event system
 */
export type EventActions = {
  'k1.login': {
    address: Address;
    wallet?: Wallet;
  };
  'k1.login.init': null;
  'k1.logout': null;
  'smart-contract.logout': null;
  'account.token.emitted': { token: string; expiresAt: number };
  'account.refresh.token.emitted': { refreshToken: string; expiresAt: number };
  'flow.complete': null;
  'modal.open': null;
};

/**
 * The names of the actions available for the event system, for strong typing purposes
 */
export type EventActionsNames = keyof EventActions;
