"use client";

import EventEmitter from "events";
import { useEffect } from "react";
import type {
  FromNativeActionNames,
  FromNativeActions,
  FromWebActionNames,
  FromWebActions,
} from "./messages";

const RNEvents = new EventEmitter();

/**
 * Sends a structured message to the React Native Bridge
 */
export const sendMessageToRN = <T extends FromWebActionNames>(
  action: T,
  payload: FromWebActions[T]
) => {
  window.ReactNativeWebView.postMessage(JSON.stringify({ action, payload }));
};

/**
 * Registers a handler for a specific action from the React Native Bridge, so that we can receive
 * messages from the bridge and process in the web page.
 *
 * @param action - The action to register the handler for
 * @param callback - The callback to call when the action is received
 * @returns A function to deregister the handler
 */
export const registerRNHandler = <T extends FromNativeActionNames>(
  action: T,
  callback: (payload: FromNativeActions[T]) => void
) => {
  RNEvents.on(action, callback);
  return () => RNEvents.off(action, callback);
};

/**
 * A simple hook to handler messages from the React Native Bridge, so that we can receive
 * messages from the bridge and process in any react component.
 *
 * @param action - The action to register the handler for
 * @param callback - The callback to call when the action is received
 * @returns A function to deregister the handler
 */
export const useRNHandler = <T extends FromNativeActionNames>(
  action: T,
  callback: (payload: FromNativeActions[T]) => void
) => {
  useEffect(() => {
    const deregister = registerRNHandler(action, callback);
    return () => {
      deregister();
    };
  }, [action, callback]);
};

const onMessageFromRN = (message: string) => {
  const { action, payload } = JSON.parse(message);
  console.log("onMessageFromRN", action, payload);
  RNEvents.emit(action, payload);
};

// Attach the handler to `window` so we can access it from
// scripts injected by React Native WebView.
if (typeof window !== "undefined") {
  window.onMessageFromRN = onMessageFromRN;
}
