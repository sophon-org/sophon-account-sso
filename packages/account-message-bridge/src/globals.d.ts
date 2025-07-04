declare global {
  interface Window {
    ReactNativeWebView: {
      postMessage(data: string): void;
    };
    onMessageFromRN: (message: string) => void;
  }
}

export {};
