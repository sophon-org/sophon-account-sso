import { useState } from 'react';
import { sendUIMessage, useUIEventHandler } from '../messaging/ui';

export const useModalVisibility = () => {
  const [visible, setVisible] = useState(false);
  const [showCount, setShowCount] = useState(0);
  const [hideCount, setHideCount] = useState(0);

  useUIEventHandler('showModal', () => {
    // 🚨 PREVENT SPAM: Don't show already visible modal
    if (visible) {
      console.log('🚨 [DRAWER-DEBUG] Ignoring showModal - modal already visible (showCount:', showCount, ', hideCount:', hideCount, ')');
      return;
    }
    
    const newShowCount = showCount + 1;
    setShowCount(newShowCount);
    
    console.log('🔍 [DRAWER-DEBUG] showModal triggered:', {
      previousVisible: visible,
      newShowCount,
      hideCount,
      callStack: new Error().stack?.split('\n').slice(1, 3).join(' | '),
      timestamp: new Date().toLocaleTimeString()
    });
    
    setVisible(true);
    console.log('🔍 [DRAWER-DEBUG] Sending modalReady immediately');
    sendUIMessage('modalReady', {});
  });
  
  useUIEventHandler('hideModal', () => {
    // 🚨 PREVENT SPAM: Don't hide already hidden modal
    if (!visible) {
      console.log('🚨 [DRAWER-DEBUG] Ignoring hideModal - modal already hidden (showCount:', showCount, ', hideCount:', hideCount, ')');
      return;
    }
    
    const newHideCount = hideCount + 1;
    setHideCount(newHideCount);
    
    console.log('🔍 [DRAWER-DEBUG] hideModal triggered:', {
      previousVisible: visible,
      showCount,
      newHideCount,
      timestamp: new Date().toLocaleTimeString()
    });
    
    setVisible(false);
  });

  return {
    visible,
  };
};
