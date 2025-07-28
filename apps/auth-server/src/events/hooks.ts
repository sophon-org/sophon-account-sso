import { useEffect } from 'react';
import { registerEventHandler } from './handlers';
import type { EventActions, EventActionsNames } from './messages';

/**
 * A simple hook to handler messages from the event system and integrate them
 * into any react component.
 *
 * @param action - The action to register the handler for
 * @param callback - The callback to call when the action is received
 * @returns A function to deregister the handler
 */
export const useEventHandler = <T extends EventActionsNames>(
  action: T,
  callback: (payload: EventActions[T]) => void,
) => {
  useEffect(() => {
    const deregister = registerEventHandler(action, callback);
    return () => {
      deregister();
    };
  }, [action, callback]);
};
