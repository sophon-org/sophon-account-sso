import { useEffect, useState } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
}

/**
 * Hook to monitor network connectivity status in WebView environments
 * Provides real-time updates when network status changes
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize with current status, fallback to true if navigator is not available
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    // Skip if we're in SSR environment
    if (typeof window === 'undefined') return;

    const handleOffline = () => {
      console.log('📵 Network went OFFLINE');
      setIsOnline(false);
    };

    const handleOnline = () => {
      console.log('📶 Network came back ONLINE');
      setIsOnline(true);
    };

    // Listen for network status changes
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  //TODO: Figure out where and how we want to use this
  return {
    isOnline,
    isOffline: !isOnline,
  };
};
