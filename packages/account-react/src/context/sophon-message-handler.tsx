import { useEffect } from 'react';
import { useSophonContext } from '../hooks/useSophonContext';

export const SophonMessageHandler = () => {
  const { updateToken, authServerUrl } = useSophonContext();

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      // just drop any message that didn't come from our auth server
      if (!authServerUrl.startsWith(event.origin)) {
        return;
      }

      if (event.data.type === 'token') {
        updateToken(event.data.payload);
      }
    };

    window.addEventListener('message', listener);

    return () => {
      window.removeEventListener('message', listener);
    };
  }, [updateToken, authServerUrl]);

  return null;
};
