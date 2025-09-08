import { useEffect } from 'react';
import { useSophonContext } from '../hooks/useSophonContext';

export const SophonMessageHandler = () => {
  const { updateToken, updateRefreshToken, authServerUrl } = useSophonContext();

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      // just drop any message that didn't come from our auth server
      if (new URL(authServerUrl).origin !== event.origin) {
        return;
      }

      if (event.data.type === 'token') {
        updateToken(event.data.payload);
      }

      if (event.data.type === 'refresh.token') {
        updateRefreshToken(event.data.payload);
      }
    };

    window.addEventListener('message', listener);

    return () => {
      window.removeEventListener('message', listener);
    };
  }, [updateToken, updateRefreshToken, authServerUrl]);

  return null;
};
