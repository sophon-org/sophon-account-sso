import type { UUID } from 'node:crypto';
import { EventEmitter } from 'eventemitter3';
import { useEffect } from 'react';
import type { Message } from 'zksync-sso/communicator';

const SophonUIEvents = new EventEmitter();

export type SophonUIActions = {
  showModal: unknown;
  hideModal: unknown;
  modalReady: unknown;
  incomingRpc: Message;
  outgoingRpc: Message;
  setToken: string;
  logout: unknown;
  timeout: UUID;
  refreshMainView: unknown;
  // from server:
  sdkStatusResponse: unknown;
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
