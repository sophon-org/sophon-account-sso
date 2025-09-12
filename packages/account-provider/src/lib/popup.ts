export const DEFAULT_UNLOAD_TIMEOUT = 1000;
export const DEFAULT_UNLOAD_DELAY = 500;

// TODO: ideally we would stack requests on the server, and dont close the popup
// while there's pending requests, for now we just wait a little bit to avoid getting the popup
// blocked
export const awaitForPopupUnload = (authServerUrl: string) => {
  // no need to wait for it if window is not available
  if (typeof window === 'undefined' || !window?.addEventListener) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const waitLimitTimeout = setTimeout(() => {
      resolve(true);
    }, DEFAULT_UNLOAD_TIMEOUT);

    const listener = (event: MessageEvent) => {
      if (!authServerUrl.startsWith(event.origin)) {
        return;
      }

      if (event.data.event === 'PopupUnload') {
        window.removeEventListener('message', listener);
        setTimeout(() => {
          clearTimeout(waitLimitTimeout);
          resolve(true);
        }, DEFAULT_UNLOAD_DELAY);
      }
    };

    window.addEventListener('message', listener);
  });
};
