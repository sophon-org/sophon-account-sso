import { useState } from 'react';
import { sendUIMessage, useUIEventHandler } from '../messaging/ui';

export const useModalVisibility = () => {
  const [visible, setVisible] = useState(false);

  useUIEventHandler('showModal', () => {
    console.log('🔥 FLOW COMPLETE - WebView SHOWING!', new Date().toLocaleTimeString());
    setVisible(true);
    setTimeout(() => {
      sendUIMessage('modalReady', {});
    }, 1000); //TODO: remove this
  });
  useUIEventHandler('hideModal', () => {
    console.log('🔥 FLOW COMPLETE - WebView HIDING!', new Date().toLocaleTimeString());
    setVisible(false);
  });

  return {
    visible,
  };
};
