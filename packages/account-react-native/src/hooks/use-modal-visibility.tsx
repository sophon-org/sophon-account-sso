import { useState } from 'react';
import { sendUIMessage, useUIEventHandler } from '../messaging/ui';

export const useModalVisibility = () => {
  const [visible, setVisible] = useState(false);

  useUIEventHandler('showModal', () => {
    setVisible(true);
    setTimeout(() => {
      //TODO: remove this
      sendUIMessage('modalReady', {});
    }, 1000);
  });
  useUIEventHandler('hideModal', () => {
    setVisible(false);
  });

  return {
    visible,
  };
};
