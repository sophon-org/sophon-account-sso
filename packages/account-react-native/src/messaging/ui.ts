import { EventEmitter } from 'eventemitter3';
import { useEffect } from 'react';
import type { Message } from 'zksync-sso/communicator';

const SophonUIEvents = new EventEmitter();

// Circuit breaker removed - was blocking normal operation

export type SophonUIActions = {
  showModal: unknown;
  hideModal: unknown;
  modalReady: unknown;
  incomingRpc: Message;
  outgoingRpc: Message;
  setToken: string;
  logout: unknown;
  // 🚀 Status/result from wallet web app 
  webWalletStatus: { success: boolean; error?: string; account?: any };
  // 🚀 Safe SDK status updates (read-only for external apps)
  sdkStatusUpdate: { 
    isHealthy: boolean; 
    lastError: string | null; 
    serverReachable: boolean; 
    webViewResponsive: boolean; 
    connectionState: 'idle' | 'connecting' | 'connected' | 'error';
    lastUpdate: number;
  };
  // 🚨 Critical SDK errors that apps should handle (server crash during tx, etc.)
  sdkCriticalError: {
    type: 'server_crash' | 'webview_unresponsive' | 'transaction_interrupted' | 'connection_lost';
    message: string;
    timestamp: number;
    recoverySuggestion?: string;
  };
  // 🚀 Server unavailable notification from connect()
  serverUnavailable: { authServerUrl: string };
  // 🚀 Server recovered notification from health check
  serverRecovered: unknown;
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
