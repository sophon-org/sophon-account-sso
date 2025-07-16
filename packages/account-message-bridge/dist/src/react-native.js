const buildMessageJavaScript = (action, payload) => {
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
export const postMessageToWebApp = (webViewRef, action, payload) => {
    console.log("postMessageToWebApp", webViewRef.current ? "ready" : "not ready", action, payload);
    webViewRef.current?.injectJavaScript(buildMessageJavaScript(action, payload));
};
