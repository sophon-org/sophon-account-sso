import { useEffect } from 'react';
import { Platform } from 'react-native';
import { sendUIMessage } from '../../messaging/ui';

interface WebViewDebugProps {
  visible: boolean;
  isReady: boolean;
  siteLoaded: boolean;
  isCancelled: boolean;
  webViewResponsive: boolean;
  serverAvailable: boolean;
  hasPendingRPC: boolean;
  lastInteraction: number;
}

/**
 * Hook for WebView debugging and monitoring
 * Logs state changes and platform-specific information
 */
export function useWebViewDebug({
  visible,
  isReady,
  siteLoaded,
  isCancelled,
  webViewResponsive,
  serverAvailable,
  hasPendingRPC,
  lastInteraction
}: WebViewDebugProps) {
  // Master debug: Track all state changes
  useEffect(() => {
    console.log('🔍 [MASTER-DEBUG] State snapshot:', {
      visible,
      isReady, 
      siteLoaded,
      isCancelled,
      webViewResponsive,
      serverAvailable,
      hasPendingRPC,
      lastInteraction: Date.now() - lastInteraction + 'ms ago',
      platform: Platform.OS,
      timestamp: new Date().toLocaleTimeString(),
      hasWebViewRef: true
    });
    
    // Send SDK status update to useSophonAccount
    sendUIMessage('sdkStatusUpdate', {
      isHealthy: serverAvailable && webViewResponsive && siteLoaded,
      lastError: !serverAvailable ? 'Server unavailable' : !webViewResponsive ? 'WebView unresponsive' : !siteLoaded ? 'Site not loaded' : null,
      serverReachable: serverAvailable,
      webViewResponsive,
      connectionState: hasPendingRPC ? 'connecting' : (serverAvailable && webViewResponsive && siteLoaded) ? 'idle' : 'error',
      lastUpdate: Date.now()
    });
  }, [visible, isReady, siteLoaded, isCancelled, webViewResponsive, serverAvailable, hasPendingRPC, lastInteraction]);

  // Track unresponsive state after cancellation
  useEffect(() => {
    if (isCancelled && visible) {
      console.log('🚨 [UNRESPONSIVE-DEBUG] WebView shown after cancellation - potential unresponsive state');
    }
  }, [isCancelled, visible]);

  // Track drawer reopening
  useEffect(() => {
    if (visible) {
      console.log('🔍 [DRAWER-DEBUG] Modal showing - check for unwanted reopening:', {
        isCancelled,
        lastInteraction: Date.now() - lastInteraction + 'ms ago',
        callStack: new Error().stack?.split('\n').slice(1, 4).join(' | ')
      });
    }
  }, [visible, isCancelled, lastInteraction]);

  // Platform-specific logging
  useEffect(() => {
    console.log('🔍 [PLATFORM-DEBUG] Platform info:', {
      platform: Platform.OS,
      version: Platform.Version,
      isAndroid: Platform.OS === 'android',
      webViewScrollSettings: {
        scrollEnabled: Platform.OS === 'android',
        nestedScrollEnabled: Platform.OS === 'android',
        overScrollMode: Platform.OS === 'android' ? "always" : "never"
      }
    });
  }, []);
}
