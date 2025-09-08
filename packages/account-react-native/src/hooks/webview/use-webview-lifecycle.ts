import { useEffect, useRef } from 'react';

/**
 * Hook to manage WebView component lifecycle
 * Tracks mount/unmount and prop changes for debugging
 */
export function useWebViewLifecycle(authServerUrl?: string, partnerId?: string) {
  const mountCount = useRef(0);
  const renderCount = useRef(0);
  const prevAuthServerUrl = useRef(authServerUrl);

  // Track component mount/unmount
  useEffect(() => {
    mountCount.current++;
    console.log(`🚀 [MOUNT-DEBUG] SophonMainView MOUNTED (mount #${mountCount.current})`, {
      authServerUrl,
      partnerId,
      timestamp: new Date().toLocaleTimeString()
    });
    
    return () => {
      console.log(`🔴 [MOUNT-DEBUG] SophonMainView UNMOUNTED (was mount #${mountCount.current})`);
    };
  }, []);
  
  // Track render count and URL changes
  renderCount.current++;
  if (prevAuthServerUrl.current !== authServerUrl) {
    console.log('⚠️ [RENDER-DEBUG] authServerUrl CHANGED!', {
      old: prevAuthServerUrl.current,
      new: authServerUrl,
      renderCount: renderCount.current
    });
    prevAuthServerUrl.current = authServerUrl;
  }

  return {
    mountCount: mountCount.current,
    renderCount: renderCount.current
  };
}
