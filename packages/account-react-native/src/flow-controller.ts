import type WebView from 'react-native-webview';

let currentWebView: WebView | null = null;

export const FlowController = {
  get webView() {
    return currentWebView;
  },

  init: (webViewRef: React.RefObject<WebView | null>) => {
    currentWebView = webViewRef.current;
    if (!currentWebView) {
      // throw new Error('WebView not found');
      console.error('WebView not provided');
    }
    return FlowController;
  },
};
