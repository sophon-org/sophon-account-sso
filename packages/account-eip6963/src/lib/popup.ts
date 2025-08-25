// TODO: ideally we would stack requests on the server, and dont close the popup
// while there's pending requests, for now we just wait a little bit to avoid getting the popup
// blocked
export const awaitForPopupUnload = (authServerUrl: string) => {
  return new Promise((resolve) => {
    const waitLimitTimeout = setTimeout(() => {
      resolve(true);
    }, 1000);

    const listener = (event: MessageEvent) => {
      if (!authServerUrl.startsWith(event.origin)) {
        return;
      }

      if (event.data.event === 'PopupUnload') {
        window.removeEventListener('message', listener);
        setTimeout(() => {
          clearTimeout(waitLimitTimeout);
          resolve(true);
        }, 500);
      }
    };

    window.addEventListener('message', listener);
  });
};
