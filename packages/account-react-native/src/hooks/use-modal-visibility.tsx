import { useState } from 'react';
import { sendUIMessage, useUIEventHandler } from '../messaging/ui';

export const useModalVisibility = () => {
  const [visible, setVisible] = useState(false);

  useUIEventHandler('showModal', () => {
    console.log('showModal');
    setVisible(true);
    setTimeout(() => {
      //TODO: remove this
      sendUIMessage('modalReady', {});
    }, 1000);
  });
  useUIEventHandler('hideModal', () => {
    console.log('hideModal');
    setVisible(false);
  });

  return {
    visible,
  };
};
