import { EventEmitter } from 'eventemitter3';
import type { EventActions, EventActionsNames } from './messages';

const RNEvents = new EventEmitter();

/**
 * Sends a structured message to the React Native Bridge
 */
export const sendMessage = <T extends EventActionsNames>(
  action: T,
  payload: EventActions[T],
) => {
  RNEvents.emit(action, payload);
};

/**
 * Registers a handler for a specific action from the React Native Bridge, so that we can receive
 * messages from the bridge and process in the web page.
 *
 * @param action - The action to register the handler for
 * @param callback - The callback to call when the action is received
 * @returns A function to deregister the handler
 */
export const registerEventHandler = <T extends EventActionsNames>(
  action: T,
  callback: (payload: EventActions[T]) => void,
) => {
  RNEvents.on(action, callback);
  return () => RNEvents.off(action, callback);
};
