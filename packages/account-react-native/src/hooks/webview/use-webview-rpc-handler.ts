import { useCallback, useRef } from 'react';
import { postMessageToWebApp } from '@sophon-labs/account-message-bridge';
import type { WebView } from 'react-native-webview';
import { sendUIMessage, useUIEventHandler } from '../../messaging/ui';

interface RpcHandlerProps {
  webViewRef: React.RefObject<WebView>;
  isReady: boolean;
  siteLoaded: boolean;
  isCancelled: boolean;
  webViewResponsive: boolean;
  lastInteraction: number;
  hasPendingRPC: boolean;
  setHasPendingRPC: (pending: boolean) => void;
  setLastInteraction: (time: number) => void;
  setWebViewResponsive: (responsive: boolean) => void;
}

/**
 * Hook to handle RPC communication between React Native and WebView
 * Manages outgoing RPC requests and pending state
 */
export function useWebViewRpcHandler({
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
}: RpcHandlerProps) {
  const rpcTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle modalReady event - send openModal to WebView
  useUIEventHandler(
    'modalReady',
    useCallback(() => {
      console.log('🔍 [DRAWER-DEBUG] modalReady handler called - WebView should be shown:', {
        isReady,
        siteLoaded,
        isCancelled,
        webViewResponsive
      });
      
      // Reset WebView state for new connection attempt
      setLastInteraction(Date.now());
      setWebViewResponsive(true);
      console.log('🔄 [CRASH-DEBUG] Reset WebView state for new connection attempt');
      
      try {
        console.log('🚀 [CRASH-DEBUG] Sending openModal to WebView after modalReady - attempting postMessage');
        postMessageToWebApp(webViewRef, 'openModal', {});
        setWebViewResponsive(true);
        console.log('✅ [CRASH-DEBUG] openModal sent successfully after modalReady');
      } catch (error) {
        console.log('🚨 [CRASH-DEBUG] Failed to send openModal after modalReady:', error);
        setWebViewResponsive(false);
        sendUIMessage('webWalletStatus', { 
          success: false, 
          error: 'Failed to communicate with WebView after modal ready'
        });
      }
    }, [isReady, siteLoaded, isCancelled, webViewResponsive, setLastInteraction, setWebViewResponsive, webViewRef]),
  );

  // Handle outgoing RPC requests
  useUIEventHandler(
    'outgoingRpc',
    useCallback(
      (payload) => {
        console.log('🔍 [UNRESPONSIVE-DEBUG] Sending RPC to WebView:', { 
          payload: JSON.stringify(payload, null, 2), 
          isReady, 
          siteLoaded,
          isCancelled,
          webViewResponsive,
          hasWebViewRef: !!webViewRef.current,
          timeSinceLastInteraction: Date.now() - lastInteraction + 'ms'
        });
        
        // Special handling for logout - always try to send it
        const payloadAny = payload as any;
        const isLogout = payloadAny?.action === 'logout' || payloadAny?.method === 'logout';
        if (isLogout) {
          console.log('🔍 [LOGOUT] Sending logout to WebView - bypassing readiness checks');
          if (webViewRef.current) {
            try {
              postMessageToWebApp(webViewRef, 'rpc', payloadAny);
              console.log('✅ [LOGOUT] Logout sent to WebView');
            } catch (error) {
              console.log('⚠️ [LOGOUT] Failed to send logout to WebView:', error);
            }
          }
          return;
        }
        
        if (!isReady || !siteLoaded) {
          console.log('❌ [UNRESPONSIVE-DEBUG] WebView not ready or site not loaded, cannot send RPC - REJECTING Promise');
          sendUIMessage('webWalletStatus', { 
            success: false, 
            error: !isReady ? 'WebView not ready to send RPC request' : 'Wallet site not loaded in WebView'
          });
          return;
        }
        
        if (!webViewRef.current) {
          console.log('🚨 [CRASH-DEBUG] WebView ref is null - REJECTING Promise');
          sendUIMessage('webWalletStatus', { 
            success: false, 
            error: 'WebView not available - cannot send RPC' 
          });
          return;
        }

        if (isCancelled) {
          console.log('⚠️ [UNRESPONSIVE-DEBUG] Sending RPC to previously cancelled WebView - checking responsiveness');
        }

        try {
          console.log('🚀 [CRASH-DEBUG] About to postMessageToWebApp:', { action: 'rpc', payload });
          
          // Mark RPC as pending for in-flight monitoring
          setHasPendingRPC(true);
          console.log('🔍 [RPC-INFLIGHT] Marked RPC as pending - starting server monitoring');
          
          // Set aggressive timeout for in-flight RPC
          rpcTimeoutRef.current = setTimeout(() => {
            if (hasPendingRPC) {
              console.log('🚨 [RPC-INFLIGHT] RPC timeout - server may have crashed during request');
              setHasPendingRPC(false);
              sendUIMessage('webWalletStatus', { 
                success: false, 
                error: 'Authentication timed out - server may have crashed during request'
              });
            }
          }, 15000); // 15 second RPC timeout
          
          // biome-ignore lint/suspicious/noExplicitAny: future check
          postMessageToWebApp(webViewRef, 'rpc', payload as any);
          setLastInteraction(Date.now());
          setWebViewResponsive(true);
          console.log('✅ [CRASH-DEBUG] RPC sent successfully');
        } catch (error) {
          console.log('🚨 [CRASH-DEBUG] Failed to send RPC:', error);
          setWebViewResponsive(false);
          setHasPendingRPC(false);
          sendUIMessage('webWalletStatus', { 
            success: false, 
            error: 'Failed to send RPC to WebView'
          });
        }
      },
      [isReady, siteLoaded, isCancelled, webViewResponsive, lastInteraction, hasPendingRPC, 
       setHasPendingRPC, setLastInteraction, setWebViewResponsive, webViewRef],
    ),
  );

  // Handle server unavailable notifications
  useUIEventHandler('serverUnavailable', useCallback((payload: { authServerUrl: string }) => {
    console.log('🔍 [SERVER-UNAVAILABLE] Received notification from connect() - starting health monitoring for:', payload.authServerUrl);
  }, []));

  return {
    rpcTimeoutRef
  };
}
