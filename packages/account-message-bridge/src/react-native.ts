import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import type { FromNativeActionNames, FromNativeActions } from './messages';

const buildMessageJavaScript = <T extends FromNativeActionNames>(
  action: T,
  payload: FromNativeActions[T],
) => {
  const message = JSON.stringify({ action, payload });
  // Stringify the message a second time to escape quotes etc.
  const safeString = JSON.stringify(message);
  return `window.onMessageFromRN(${safeString});`;
};

/**
 * Publish a message to the web app
 *
 * @param webViewRef the target webview to send the message to
 * @param action action key to identify the message
 * @param payload the payload of the message
 */
export const postMessageToWebApp = <T extends FromNativeActionNames>(
  webViewRef: RefObject<WebView | null>,
  action: T,
  payload: FromNativeActions[T],
) => {
  try {
    webViewRef.current?.injectJavaScript(
      buildMessageJavaScript(action, payload),
    );
  } catch {
    console.log('Error calling:', buildMessageJavaScript(action, payload));
  }
};
