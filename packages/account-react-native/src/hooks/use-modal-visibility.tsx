import { useState } from 'react';
import { useUIEventHandler } from '../messaging/ui';

export const useModalVisibility = () => {
  const [visible, setVisible] = useState(false);

  useUIEventHandler('showModal', () => {
    console.log('showModal');
    setVisible(true);
  });
  useUIEventHandler('hideModal', () => {
    console.log('hideModal');
    setVisible(false);
  });

  return {
    visible,
  };
};
