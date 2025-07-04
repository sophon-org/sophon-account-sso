import type { RefObject } from "react";
import WebView from "react-native-webview";
import type { FromNativeActionNames, FromNativeActions } from "./messages";
/**
 * Publish a message to the web app
 *
 * @param webViewRef the target webview to send the message to
 * @param action action key to identify the message
 * @param payload the payload of the message
 */
export declare const postMessageToWebApp: <T extends FromNativeActionNames>(webViewRef: RefObject<WebView | null>, action: T, payload: FromNativeActions[T]) => void;
