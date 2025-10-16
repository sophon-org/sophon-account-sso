import type { UUID } from 'node:crypto';
import type { Message } from '@sophon-labs/account-communicator';
import { EventEmitter } from 'eventemitter3';
import { useEffect } from 'react';
import type { SophonJWTToken } from '@/types';

const SophonUIEvents = new EventEmitter();

interface SDKStatusResponse {
  isDrawerOpen: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  connectedAccount: boolean;
}

export type SophonUIActions = {
  initialized: unknown;
  showModal: { requestId: UUID };
  hideModal: unknown;
  modalReady: unknown;
  incomingRpc: Message;
  outgoingRpc: Message;
  setAccessToken: SophonJWTToken;
  setRefreshToken: SophonJWTToken;
  logout: unknown;
  timeout: UUID;
  refreshMainView: unknown;
  clearMainViewCache: unknown;
  mainViewError: string;
  handleError: {
    description: string;
    code: number;
  };
  // from server:
  sdkStatusResponse: SDKStatusResponse;
  sdkStatusRequest: unknown;
};

export type SophonUIActionsName = keyof SophonUIActions;

/**
 * Registers a handler for a specific action from the React Native Bridge, so that we can receive
 * messages from the bridge and process in the web page.
 *
 * @param action - The action to register the handler for
 * @param callback - The callback to call when the action is received
 * @returns A function to deregister the handler
 */
export const registerUIEventHandler = <T extends SophonUIActionsName>(
  action: T,
  callback: (payload: SophonUIActions[T]) => void,
) => {
  SophonUIEvents.on(action, callback);
  return () => SophonUIEvents.off(action, callback);
};

/**
 * A simple hook to handler messages from the React Native Bridge, so that we can receive
 * messages from the bridge and process in any react component.
 *
 * @param action - The action to register the handler for
 * @param callback - The callback to call when the action is received
 * @returns A function to deregister the handler
 */
export const useUIEventHandler = <T extends SophonUIActionsName>(
  action: T,
  callback: (payload: SophonUIActions[T]) => void,
) => {
  useEffect(() => {
    const deregister = registerUIEventHandler(action, callback);
    return () => {
      deregister();
    };
  }, [action, callback]);
};

export const sendUIMessage = <T extends SophonUIActionsName>(
  action: T,
  payload: SophonUIActions[T],
) => {
  SophonUIEvents.emit(action, payload);
};
