import EventEmitter from "events";
import type { FromNativeActionNames, FromNativeActions, FromWebActionNames, FromWebActions } from "./messages";
/**
 * Sends a structured message to the React Native Bridge
 */
export declare const sendMessageToRN: <T extends FromWebActionNames>(action: T, payload: FromWebActions[T]) => void;
/**
 * Registers a handler for a specific action from the React Native Bridge, so that we can receive
 * messages from the bridge and process in the web page.
 *
 * @param action - The action to register the handler for
 * @param callback - The callback to call when the action is received
 * @returns A function to deregister the handler
 */
export declare const registerRNHandler: <T extends FromNativeActionNames>(action: T, callback: (payload: FromNativeActions[T]) => void) => () => EventEmitter<[never]>;
/**
 * A simple hook to handler messages from the React Native Bridge, so that we can receive
 * messages from the bridge and process in any react component.
 *
 * @param action - The action to register the handler for
 * @param callback - The callback to call when the action is received
 * @returns A function to deregister the handler
 */
export declare const useRNHandler: <T extends FromNativeActionNames>(action: T, callback: (payload: FromNativeActions[T]) => void) => void;
