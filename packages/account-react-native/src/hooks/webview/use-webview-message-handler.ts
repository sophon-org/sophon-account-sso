import type { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { postMessageToWebApp } from '@sophon-labs/account-message-bridge';
import { sendUIMessage } from '../../messaging/ui';
import { SophonAppStorage, StorageKeys } from '../../provider/storage';

interface MessageHandlerProps {
  webViewRef: React.RefObject<WebView>;
  siteLoaded: boolean;
  setSiteLoaded: (loaded: boolean) => void;
  sessionRestored: boolean;
  setSessionRestored: (restored: boolean) => void;
  isCancelled: boolean;
  setIsCancelled: (cancelled: boolean) => void;
  setLastInteraction: (time: number) => void;
  setWebViewResponsive: (responsive: boolean) => void;
  hasPendingRPC: boolean;
  setHasPendingRPC: (pending: boolean) => void;
  rpcTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

/**
 * Hook to handle incoming messages from WebView
 * Processes various message types and updates state accordingly
 */
export function useWebViewMessageHandler({
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
}: MessageHandlerProps) {

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const { action, payload } = JSON.parse(event.nativeEvent.data);
      
      // Track responsiveness
      setLastInteraction(Date.now());
      setWebViewResponsive(true);
      
      console.log('🔍 [UNRESPONSIVE-DEBUG] WebView received message:', { 
        action, 
        isCancelled,
        webViewResponsive: true,
        timeSinceLastInteraction: 'now',
        payload: JSON.stringify(payload, null, 2) 
      });
      
      // First message from site = site is loaded and working!
      if (!siteLoaded) {
        console.log('✅ [MASTER-DEBUG] First message from wallet site - site is loaded!');
        setSiteLoaded(true);
        
        // Check if we have saved account/token to restore
        if (!sessionRestored) {
          const savedAccount = SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT);
          const savedToken = SophonAppStorage.getItem(StorageKeys.USER_TOKEN);
          
          if (savedAccount && savedToken) {
            console.log('🔄 [SESSION-RESTORE] Found saved session, restoring in WebView...');
            try {
              // Send restore session message to WebView as a custom rpc
              const restoreId = `${Date.now()}-0000-0000-0000-000000000001`;
              // biome-ignore lint/suspicious/noExplicitAny: custom message type
              postMessageToWebApp(webViewRef, 'rpc', {
                id: restoreId as `${string}-${string}-${string}-${string}-${string}`,
                action: 'restoreSession',
                account: JSON.parse(savedAccount),
                token: savedToken
              } as any);
              setSessionRestored(true);
              console.log('✅ [SESSION-RESTORE] Session restore message sent to WebView');
            } catch (error) {
              console.log('❌ [SESSION-RESTORE] Failed to restore session:', error);
            }
          } else {
            console.log('🔍 [SESSION-RESTORE] No saved session to restore');
            setSessionRestored(true);
          }
        }
      }
      
      // Handle different message types
      switch (action) {
        case 'closeModal':
          console.log('🔍 [DRAWER-DEBUG] Received closeModal from WebView');
          setIsCancelled(true);
          
          // Clear any pending RPC on cancellation
          if (hasPendingRPC) {
            console.log('🚨 [RPC-INFLIGHT] User cancelled during pending RPC - clearing state');
            setHasPendingRPC(false);
            if (rpcTimeoutRef.current) {
              clearTimeout(rpcTimeoutRef.current);
              rpcTimeoutRef.current = null;
            }
            sendUIMessage('webWalletStatus', { 
              success: false, 
              error: 'User cancelled authentication'
            });
          }
          
          sendUIMessage('hideModal', payload);
          break;

        case 'rpc':
          // Check for auth result in RPC response
          const hasError = payload?.content?.error;
          const result = payload?.content?.result;
          
          console.log('🔍 [UNRESPONSIVE-DEBUG] RPC response received:', {
            hasError: !!hasError,
            hasResult: !!result,
            isCancelled,
            hasPendingRPC,
            method: payload?.content?.action?.method
          });
          
          // Clear pending RPC state - we got a response!
          if (hasPendingRPC) {
            console.log('✅ [RPC-INFLIGHT] RPC response received - clearing pending state');
            setHasPendingRPC(false);
            if (rpcTimeoutRef.current) {
              clearTimeout(rpcTimeoutRef.current);
              rpcTimeoutRef.current = null;
            }
          }
          
          if (hasError) {
            const errorMessage = hasError.message || hasError.toString() || 'RPC method failed';
            console.log('🔍 [UNRESPONSIVE-DEBUG] RPC error - sending webWalletStatus');
            sendUIMessage('webWalletStatus', { 
              success: false, 
              error: errorMessage 
            });
          } else if (result) {
            console.log('🔍 [UNRESPONSIVE-DEBUG] RPC success - sending webWalletStatus');
            sendUIMessage('webWalletStatus', { 
              success: true, 
              account: result 
            });
          }
          
          sendUIMessage('incomingRpc', payload);
          break;

        case 'account.token.emitted':
          console.log('🔍 [MASTER-DEBUG] Token emitted from WebView');
          sendUIMessage('setToken', payload);
          break;

        case 'logout':
          console.log('🔍 [DISCONNECT-DEBUG] Logout action received from WebView');
          sendUIMessage('logout', payload);
          break;

        case 'siteReady':
          console.log('✅ [SITE-READY] Embedded site confirmed it is loaded and ready');
          if (!siteLoaded) {
            setSiteLoaded(true);
          }
          break;

        case 'sessionRestored':
          console.log('✅ [SESSION-RESTORE] WebView confirmed session restoration');
          break;

        case 'pong':
          // Handle ping/pong for health checks
          const pingTimestamp = payload?.timestamp || 0;
          const pongTime = Date.now();
          const roundTripTime = pongTime - pingTimestamp;
          
          console.log('🏓 [HEALTHCHECK] Received pong from WebView (RTT:', roundTripTime + 'ms)');
          setWebViewResponsive(true);
          break;
      }
    } catch (error) {
      console.log('🚨 [CRASH-DEBUG] Error parsing WebView message - REJECTING Promise:', error);
      setWebViewResponsive(false);
      sendUIMessage('webWalletStatus', { 
        success: false, 
        error: `Error parsing WebView message: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  return {
    handleMessage
  };
}
