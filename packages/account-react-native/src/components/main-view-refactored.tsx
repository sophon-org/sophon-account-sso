import React, { useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { VIEW_VERSION } from '../constants';
import { USER_AGENT } from '../constants/user-agent';
import { useModalVisibility } from '../hooks/use-modal-visibility';
import {
  useWebViewLifecycle,
  useWebViewServerMonitoring,
  useWebViewDebug,
  useWebViewRpcHandler,
  useWebViewMessageHandler
} from '../hooks/webview';

export interface SophonMainViewProps {
  debugEnabled?: boolean;
  insets?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  authServerUrl?: string;
  partnerId: string;
}

/**
 * Main WebView component for Sophon authentication
 * Refactored to use modular hooks for better maintainability
 */
export const SophonMainView = ({
  debugEnabled = false,
  insets,
  authServerUrl,
  partnerId,
}: SophonMainViewProps) => {
  // Refs
  const webViewRef = useRef<WebView>(null);
  const lastErrorTime = useRef<number>(0);
  
  // State
  const { visible } = useModalVisibility();
  const [isReady, setIsReady] = useState(false);
  const [siteLoaded, setSiteLoaded] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [webViewResponsive, setWebViewResponsive] = useState(true);
  const [serverAvailable, setServerAvailable] = useState(true);
  const [hasPendingRPC, setHasPendingRPC] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  // Use lifecycle hook for mount/unmount tracking
  useWebViewLifecycle(authServerUrl, partnerId);

  // Use RPC handler hook
  const { rpcTimeoutRef } = useWebViewRpcHandler({
    webViewRef,
    isReady,
    siteLoaded,
    isCancelled,
    webViewResponsive,
    lastInteraction,
    hasPendingRPC,
    setHasPendingRPC,
    setLastInteraction,
    setWebViewResponsive
  });

  // Use server monitoring hook
  useWebViewServerMonitoring({
    serverAvailable,
    hasPendingRPC,
    authServerUrl,
    setServerAvailable,
    setHasPendingRPC,
    rpcTimeoutRef
  });

  // Use debug hook for state monitoring
  useWebViewDebug({
    visible,
    isReady,
    siteLoaded,
    isCancelled,
    webViewResponsive,
    serverAvailable,
    hasPendingRPC,
    lastInteraction
  });

  // Use message handler hook
  const { handleMessage } = useWebViewMessageHandler({
    webViewRef,
    siteLoaded,
    setSiteLoaded,
    sessionRestored,
    setSessionRestored,
    isCancelled,
    setIsCancelled,
    setLastInteraction,
    setWebViewResponsive,
    hasPendingRPC,
    setHasPendingRPC,
    rpcTimeoutRef
  });

  // Build URL with parameters
  const params = new URLSearchParams();
  if (partnerId) {
    params.set('version', VIEW_VERSION);
    params.set('platformOS', Platform.OS);
    params.set('platformVersion', `${Platform.Version}`);
  }
  const uri = `${authServerUrl}/embedded/${partnerId}?${params.toString()}`;
  
  // Log URL only once when it actually changes
  React.useEffect(() => {
    console.log('🔥 WebView loading URL:', uri);
  }, [uri]);
  
  // Track WebView instance creation
  const webViewKey = `${authServerUrl}-${partnerId}`;
  const prevWebViewKey = useRef(webViewKey);
  if (prevWebViewKey.current !== webViewKey) {
    console.log('🆕 [WEBVIEW-DEBUG] Creating NEW WebView instance!', {
      oldKey: prevWebViewKey.current,
      newKey: webViewKey,
      reason: 'Key changed'
    });
    prevWebViewKey.current = webViewKey;
  }

  // Container styles with visibility
  const containerStyles = {
    ...styles.container,
    ...(visible ? styles.show : styles.hide),
  };

  return (
    <View style={containerStyles}>
      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={{ uri }}
        style={{
          ...styles.webview,
          paddingTop: insets?.top,
          paddingBottom: insets?.bottom,
          paddingLeft: insets?.left,
          paddingRight: insets?.right,
        }}
        javaScriptEnabled={true}
        startInLoadingState={true}
        renderLoading={() => <></>}
        onLoadStart={(event) => {
          console.log('🔄 [LOAD-DEBUG] WebView START loading:', {
            url: event.nativeEvent.url,
            isReady,
            siteLoaded,
            timestamp: new Date().toLocaleTimeString()
          });
        }}
        onLoadEnd={(event) => {
          // Prevent duplicate onLoadEnd calls
          if (isReady && event.nativeEvent.url === uri) {
            console.log('🔍 [DUPLICATE-DEBUG] Ignoring duplicate onLoadEnd for same URL');
            return;
          }
          
          console.log('🔥 [MASTER-DEBUG] WebView LOADED:', {
            url: event.nativeEvent.url,
            expectedUrl: uri,
            wasReady: isReady,
            canGoBack: event.nativeEvent.canGoBack,
            canGoForward: event.nativeEvent.canGoForward,
            loading: event.nativeEvent.loading,
            title: event.nativeEvent.title
          });
          
          setIsReady(true);
          setWebViewResponsive(true);
          setLastInteraction(Date.now());
          setServerAvailable(true);
          
          // Reset reload counter on successful load
          if (reloadCount > 0) {
            console.log('✅ [AUTO-RECOVERY] WebView loaded successfully - resetting reload counter (was:', reloadCount + ')');
            setReloadCount(0);
          }
          
          console.log('🔍 [UNRESPONSIVE-DEBUG] WebView loaded, waiting for site confirmation...');
          
          // Android-specific load events
          if (Platform.OS === 'android') {
            console.log('🔍 [SCROLL-DEBUG] Android WebView loaded - checking scroll capabilities');
          }
        }}
        // Platform-specific scroll settings
        scrollEnabled={Platform.OS === 'android'}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        nestedScrollEnabled={Platform.OS === 'android'}
        overScrollMode={Platform.OS === 'android' ? "always" : "never"}
        bounces={false}
        // Android-specific WebView props
        {...(Platform.OS === 'android' && {
          domStorageEnabled: true,
          javaScriptCanOpenWindowsAutomatically: false,
          mixedContentMode: 'compatibility',
          onShouldStartLoadWithRequest: (request) => {
            console.log('🔍 [SCROLL-DEBUG] Android load request:', request.url);
            return request.url.includes(authServerUrl || '');
          }
        })}
        hideKeyboardAccessoryView={true}
        allowsLinkPreview={false}
        userAgent={USER_AGENT}
        webviewDebuggingEnabled={debugEnabled}
        onShouldStartLoadWithRequest={(request) => {
          if (uri === request.url) return true;

          if (request.url.startsWith('https://sophon.xyz')) {
            Linking.openURL(request.url);
            return false;
          }

          return true;
        }}
        onMessage={handleMessage}
        onError={(event) => {
          const error = event.nativeEvent;
          const now = Date.now();
          
          // Simple debounce: skip rapid identical errors
          if (now - lastErrorTime.current < 3000) {
            return;
          }
          lastErrorTime.current = now;
          
          console.log(`🚨 [CRASH-DEBUG] WebView ERROR (handled gracefully):`, JSON.stringify(error, null, 2));
          
          // Update state tracking
          setIsReady(false);
          setSiteLoaded(false);
          setWebViewResponsive(false);
          setLastInteraction(Date.now());
          
          // Mark server as unavailable for health checking
          if (error.code === -1001 || error.code === -1004) {
            console.log('🔍 [SERVER-HEALTH] Server connection error (', error.code, ') - starting recovery monitoring');
            setServerAvailable(false);
          }
          
          // Android-specific error tracking
          if (Platform.OS === 'android') {
            console.log('🔍 [SCROLL-DEBUG] Android WebView error - may affect scrolling:', {
              errorCode: error.code,
              description: error.description,
              domain: error.domain
            });
          }
        }}
        onContentProcessDidTerminate={() => {
          console.log('🚨 [CRASH-DEBUG] WebView content process terminated');
          setWebViewResponsive(false);
          setIsReady(false);
          setSiteLoaded(false);
        }}
        onRenderProcessGone={() => {
          console.log('🚨 [CRASH-DEBUG] WebView render process gone');  
          setWebViewResponsive(false);
          setIsReady(false);
          setSiteLoaded(false);
        }}
        // Additional Android lifecycle events
        {...(Platform.OS === 'android' && {
          onLoadStart: () => {
            console.log('🔍 [SCROLL-DEBUG] Android WebView load started');
          },
          onLoadProgress: (event) => {
            console.log('🔍 [SCROLL-DEBUG] Android WebView load progress:', event.nativeEvent.progress);
          }
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    bottom: 0,
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
  },
  hide: {
    elevation: 0,
    opacity: 0,
    zIndex: -10000,
  },
  show: {
    elevation: 10000,
    opacity: 1,
    zIndex: 10000,
  },
  webview: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});
