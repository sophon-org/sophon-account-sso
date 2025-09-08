import { postMessageToWebApp } from '@sophon-labs/account-message-bridge';
import React, { useCallback, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { VIEW_VERSION } from '../constants';
import { USER_AGENT } from '../constants/user-agent';
import { useModalVisibility } from '../hooks/use-modal-visibility';
import { sendUIMessage, useUIEventHandler } from '../messaging/ui';
import { SophonAppStorage, StorageKeys } from '../provider/storage';

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
export const SophonMainView = ({
  debugEnabled = false,
  insets,
  authServerUrl,
  partnerId,
}: SophonMainViewProps) => {
  // 🔥 DEBUG: Track component mount/unmount and prop changes
  const mountCount = useRef(0);
  const renderCount = useRef(0);
  const prevAuthServerUrl = useRef(authServerUrl);
  
  React.useEffect(() => {
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
  
  renderCount.current++;
  if (prevAuthServerUrl.current !== authServerUrl) {
    console.log('⚠️ [RENDER-DEBUG] authServerUrl CHANGED!', {
      old: prevAuthServerUrl.current,
      new: authServerUrl,
      renderCount: renderCount.current
    });
    prevAuthServerUrl.current = authServerUrl;
  }
  
  const webViewRef = useRef<WebView>(null);
  const { visible } = useModalVisibility();
  const [isReady, setIsReady] = useState(false);
  const [siteLoaded, setSiteLoaded] = useState(false); // ← SITE ACTUALLY LOADED?
  const [sessionRestored, setSessionRestored] = useState(false); // ← Track if we restored session
  
  // 🔍 DEBUG: Track cancellation and unresponsive state
  const [isCancelled, setIsCancelled] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [webViewResponsive, setWebViewResponsive] = useState(true);
  
  // 🚀 SERVER HEALTH: Track server availability and auto-reload
  const [serverAvailable, setServerAvailable] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);
  const healthCheckInterval = useRef<NodeJS.Timeout | null>(null);
  
  // 🚨 RPC IN-FLIGHT: Track pending RPC requests
  const [hasPendingRPC, setHasPendingRPC] = useState(false);
  const rpcTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 🔄 AUTO-RECOVERY: WebView responsiveness monitoring
  const webViewRecoveryTimer = useRef<NodeJS.Timeout | null>(null);
  
  // 🏓 WEBVIEW HEALTHCHECK: Periodic ping/pong to detect silent hangs (TODO: implement)
  const webViewPingTimer = useRef<NodeJS.Timeout | null>(null);
  const webViewPongTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Simple error tracking
  const lastErrorTime = useRef<number>(0);

  const containerStyles = {
    ...styles.container,
    ...(visible ? styles.show : styles.hide),
  };

  // DISABLED: All reload logic temporarily removed to stop recursion

  // 🔍 MASTER DEBUG: Track all state changes for debugging
  React.useEffect(() => {
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
      hasWebViewRef: !!webViewRef.current
    });
    
    // 🚀 Send SDK status update to useSophonAccount for safe external monitoring
    sendUIMessage('sdkStatusUpdate', {
      isHealthy: serverAvailable && webViewResponsive && siteLoaded,
      lastError: !serverAvailable ? 'Server unavailable' : !webViewResponsive ? 'WebView unresponsive' : !siteLoaded ? 'Site not loaded' : null,
      serverReachable: serverAvailable,
      webViewResponsive,
      connectionState: hasPendingRPC ? 'connecting' : (serverAvailable && webViewResponsive && siteLoaded) ? 'idle' : 'error',
      lastUpdate: Date.now()
    });
  }, [visible, isReady, siteLoaded, isCancelled, webViewResponsive, serverAvailable, hasPendingRPC]);

  // 🔍 PROBLEM 1 DEBUG: Track unresponsive state after cancellation
  React.useEffect(() => {
    if (isCancelled && visible) {
      console.log('🚨 [UNRESPONSIVE-DEBUG] WebView shown after cancellation - potential unresponsive state');
    }
  }, [isCancelled, visible]);

  // 🔍 PROBLEM 2 DEBUG: Track drawer reopening
  React.useEffect(() => {
    if (visible) {
      console.log('🔍 [DRAWER-DEBUG] Modal showing - check for unwanted reopening:', {
        isCancelled,
        lastInteraction: Date.now() - lastInteraction + 'ms ago',
        callStack: new Error().stack?.split('\n').slice(1, 4).join(' | ')
      });
    }
  }, [visible]);

  // 🔍 PROBLEM 5 DEBUG: Platform-specific logging
  React.useEffect(() => {
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

  // 🚀 SERVER HEALTH: Periodic health check to reload WebView if server recovers OR if RPC hangs
  React.useEffect(() => {
    if ((!serverAvailable || hasPendingRPC) && authServerUrl) {
      const reason = !serverAvailable ? 'server recovery' : 'pending RPC monitoring';
      console.log(`🔍 [SERVER-HEALTH] Starting health check interval for ${reason}`);
      
      healthCheckInterval.current = setInterval(async () => {
        try {
          console.log(`🔍 [SERVER-HEALTH] Checking server (${reason})...`);
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch(`${authServerUrl}/api/health`, {
            method: 'GET',
            signal: controller.signal,
          });
          
          if (response.ok) {
            console.log('✅ [SERVER-HEALTH] Server is alive!');
            setServerAvailable(true);
            
            // 🚀 NOTIFY: Tell useSophonAccount that server recovered - clear connectionError
            sendUIMessage('serverRecovered', {});
            
            // If we had pending RPC and server is alive, it means RPC is stuck
            if (hasPendingRPC) {
              console.log('🚨 [RPC-INFLIGHT] Server alive but RPC pending - server may have crashed during RPC!');
              console.log('🔄 [RPC-INFLIGHT] Reloading WebView to recover from stuck RPC...');
              
              // 🚨 Send critical error to app - this affects transactions too!
              sendUIMessage('sdkCriticalError', {
                type: 'server_crash',
                message: 'Server crashed during authentication/transaction. Connection recovered automatically.',
                timestamp: Date.now(),
                recoverySuggestion: 'Please retry your transaction'
              });
              
              // Clear stuck RPC state
              setHasPendingRPC(false);
              if (rpcTimeoutRef.current) {
                clearTimeout(rpcTimeoutRef.current);
                rpcTimeoutRef.current = null;
              }
              
              // Reject any pending connection
              sendUIMessage('webWalletStatus', { 
                success: false, 
                error: 'Server crashed during authentication. Please try again.'
              });
              
              // DISABLED: No reload to stop recursion
              console.log('🚨 [RELOAD-DISABLED] Skipping WebView reload to prevent loops');
            }
            
            // Clear health check interval if server recovered
            if (healthCheckInterval.current) {
              clearInterval(healthCheckInterval.current);
              healthCheckInterval.current = null;
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log('🔍 [SERVER-HEALTH] Server still unavailable:', errorMessage);
          
          // If RPC was pending and server is down, reject immediately
          if (hasPendingRPC) {
            console.log('🚨 [RPC-INFLIGHT] Server down + pending RPC = reject immediately');
            
            // 🚨 Send critical error to app
            sendUIMessage('sdkCriticalError', {
              type: 'connection_lost',
              message: 'Lost connection to server during authentication/transaction',
              timestamp: Date.now(),
              recoverySuggestion: 'Please check server status and retry'
            });
            
            setHasPendingRPC(false);
            sendUIMessage('webWalletStatus', { 
              success: false, 
              error: 'Server became unavailable during authentication'
            });
          }
        }
      }, 5000); // Check every 5 seconds for faster recovery
    }

    // Cleanup on unmount
    return () => {
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
        healthCheckInterval.current = null;
      }
      if (rpcTimeoutRef.current) {
        clearTimeout(rpcTimeoutRef.current);
        rpcTimeoutRef.current = null;
      }
      if (webViewRecoveryTimer.current) {
        clearTimeout(webViewRecoveryTimer.current);
        webViewRecoveryTimer.current = null;
      }
      if (webViewPingTimer.current) {
        clearInterval(webViewPingTimer.current);
        webViewPingTimer.current = null;
      }
      if (webViewPongTimeout.current) {
        clearTimeout(webViewPongTimeout.current);
        webViewPongTimeout.current = null;
      }
    };
  }, [serverAvailable, hasPendingRPC, authServerUrl]);

  // 🔄 AUTO-RECOVERY: TEMPORARILY DISABLED to debug reload loops
  /*
  React.useEffect(() => {
    // Only when WebView is marked as unresponsive - reload it quickly
    if (visible && serverAvailable && !webViewResponsive && isReady) {
      console.log('🚨 [AUTO-RECOVERY] WebView is unresponsive - reloading in 3 seconds');
      
      webViewRecoveryTimer.current = setTimeout(() => {
        if (!webViewResponsive) {
          console.log('🚨 [AUTO-RECOVERY] DISABLED - WebView reload disabled to prevent loops');
        }
      }, 3000);
    }
    
    return () => {
      if (webViewRecoveryTimer.current) {
        clearTimeout(webViewRecoveryTimer.current);
        webViewRecoveryTimer.current = null;
      }
    };
  }, [visible, serverAvailable, webViewResponsive, isReady, reloadCount]);
  */

  // 🏓 WEBVIEW HEALTHCHECK: TEMPORARILY DISABLED to debug reload loops
  /*
  ... ping/pong logic was here but temporarily disabled ...
  */

  // 🚀 Handle server unavailable notifications from connect() 
  useUIEventHandler('serverUnavailable', useCallback((payload: { authServerUrl: string }) => {
    console.log('🔍 [SERVER-UNAVAILABLE] Received notification from connect() - starting health monitoring for:', payload.authServerUrl);
    setServerAvailable(false);
  }, []));



  // 🚀 REMOVED DUPLICATE showModal HANDLER - useModalVisibility() handles this!
  // Listen for modalReady instead to know when to send openModal
  useUIEventHandler(
    'modalReady',
    useCallback(() => {
      console.log('🔍 [DRAWER-DEBUG] modalReady handler called - WebView should be shown:', {
        visible,
        isReady,
        siteLoaded,
        isCancelled,
        webViewResponsive
      });
      
      // 🔄 RESET WebView state for new connection attempt
      setIsCancelled(false);
      setLastInteraction(Date.now());
      setWebViewResponsive(true); // Reset responsive flag
      setServerAvailable(true);   // Reset server availability
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
    }, [isReady, siteLoaded, visible, isCancelled, webViewResponsive]),
  );

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
        
        // 🚨 Special handling for logout - always try to send it even if WebView not fully ready
        const payloadAny = payload as any;
        const isLogout = payloadAny?.action === 'logout' || payloadAny?.method === 'logout';
        if (isLogout) {
          console.log('🔍 [LOGOUT] Sending logout to WebView - bypassing readiness checks');
          if (webViewRef.current) {
            try {
              // Send logout as rpc message (WebView expects rpc format)
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
        
        // 🔍 PROBLEM 4 DEBUG: Check WebView availability
        if (!webViewRef.current) {
          console.log('🚨 [CRASH-DEBUG] WebView ref is null - REJECTING Promise');
          sendUIMessage('webWalletStatus', { 
            success: false, 
            error: 'WebView not available - cannot send RPC' 
          });
          return;
        }

        // 🔍 PROBLEM 1 DEBUG: Check if WebView is responsive
        if (isCancelled) {
          console.log('⚠️ [UNRESPONSIVE-DEBUG] Sending RPC to previously cancelled WebView - checking responsiveness');
        }

        try {
          console.log('🚀 [CRASH-DEBUG] About to postMessageToWebApp:', { action: 'rpc', payload });
          
          // 🚨 Mark RPC as pending for in-flight monitoring
          setHasPendingRPC(true);
          console.log('🔍 [RPC-INFLIGHT] Marked RPC as pending - starting server monitoring');
          
          // Set aggressive timeout for in-flight RPC (shorter than main Promise timeout)
          rpcTimeoutRef.current = setTimeout(() => {
            if (hasPendingRPC) {
              console.log('🚨 [RPC-INFLIGHT] RPC timeout - server may have crashed during request');
              setHasPendingRPC(false);
              sendUIMessage('webWalletStatus', { 
                success: false, 
                error: 'Authentication timed out - server may have crashed during request'
              });
            }
          }, 15000); // 15 second RPC timeout (faster than main 30s timeout)
          
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
      [isReady, siteLoaded, isCancelled, webViewResponsive, lastInteraction, hasPendingRPC],
    ),
  );

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

  return (
    <View style={containerStyles}>
      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={{
          uri,
        }}
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
          setServerAvailable(true); // Server must be available if page loaded
          
          // ✅ Reset reload counter on successful load
          if (reloadCount > 0) {
            console.log('✅ [AUTO-RECOVERY] WebView loaded successfully - resetting reload counter (was:', reloadCount + ')');
            setReloadCount(0);
          }
          
          // Check if our wallet site actually loaded (not an error page)
          // We'll know this when we receive the first message from the site
          console.log('🔍 [UNRESPONSIVE-DEBUG] WebView loaded, waiting for site confirmation...');
          
          // 🔍 PROBLEM 5 DEBUG: Android-specific load events
          if (Platform.OS === 'android') {
            console.log('🔍 [SCROLL-DEBUG] Android WebView loaded - checking scroll capabilities');
          }
        }}
        // 🔍 PROBLEM 5: Android-specific scroll settings
        scrollEnabled={Platform.OS === 'android' ? true : false} // Enable scroll on Android for approval drawer
        // textZoom={0}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        nestedScrollEnabled={Platform.OS === 'android' ? true : false} // Enable nested scroll on Android
        overScrollMode={Platform.OS === 'android' ? "always" : "never"} // Allow overscroll on Android
        bounces={false}
        // 🔍 PROBLEM 5: Additional Android WebView props for scroll debugging
        {...(Platform.OS === 'android' && {
          domStorageEnabled: true,
          javaScriptCanOpenWindowsAutomatically: false,
          mixedContentMode: 'compatibility',
          onShouldStartLoadWithRequest: (request) => {
            console.log('🔍 [SCROLL-DEBUG] Android load request:', request.url);
            return request.url.includes(authServerUrl || '');
          }
        })}
        // cacheEnabled={false}
        // cacheMode="LOAD_NO_CACHE"
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
        // onLoadEnd={() => console.log('load end')}
        // onLoadStart={() => console.log('load start')}
        // onLoad={() => console.log('load')}
        onMessage={(event) => {
          try {
            const { action, payload } = JSON.parse(event.nativeEvent.data);
            
            // 🔍 PROBLEM 1 DEBUG: Track responsiveness
            setLastInteraction(Date.now());
            setWebViewResponsive(true);
            
            console.log('🔍 [UNRESPONSIVE-DEBUG] WebView received message:', { 
              action, 
              isCancelled,
              webViewResponsive,
              timeSinceLastInteraction: 'now',
              payload: JSON.stringify(payload, null, 2) 
            });
            
          // First message from site = site is loaded and working!
          if (!siteLoaded) {
            console.log('✅ [MASTER-DEBUG] First message from wallet site - site is loaded!');
            setSiteLoaded(true);
            
            // 🔄 RESTORE SESSION: Check if we have saved account/token to restore
            if (!sessionRestored) {
              const savedAccount = SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT);
              const savedToken = SophonAppStorage.getItem(StorageKeys.USER_TOKEN);
              
              if (savedAccount && savedToken) {
                console.log('🔄 [SESSION-RESTORE] Found saved session, restoring in WebView...');
                try {
                  // Send restore session message to WebView as a custom rpc
                  // biome-ignore lint/suspicious/noExplicitAny: custom message type
                  postMessageToWebApp(webViewRef, 'rpc', {
                    id: `restore-${Date.now()}`,
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
            
            if (action === 'closeModal') {
              console.log('🔍 [DRAWER-DEBUG] Received closeModal from WebView');
              setIsCancelled(true); // Mark as cancelled by user
              
              // 🚨 Clear any pending RPC on cancellation
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
            } else if (action === 'rpc') {
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
              
              // 🚨 Clear pending RPC state - we got a response!
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
            } else if (action === 'account.token.emitted') {
              console.log('🔍 [MASTER-DEBUG] Token emitted from WebView');
              sendUIMessage('setToken', payload);
            } else if (action === 'logout') {
              console.log('🔍 [DISCONNECT-DEBUG] Logout action received from WebView');
              sendUIMessage('logout', payload);
            } else if (action === 'sessionRestored') {
              console.log('✅ [SESSION-RESTORE] WebView confirmed session restoration');
              // WebView confirmed session restoration
            } else if (action === 'pong') {
              // 🏓 WEBVIEW HEALTHCHECK: Handle pong response
              const pingTimestamp = payload?.timestamp || 0;
              const pongTime = Date.now();
              const roundTripTime = pongTime - pingTimestamp;
              
              console.log('🏓 [HEALTHCHECK] Received pong from WebView (RTT:', roundTripTime + 'ms)');
              
              // Clear the pong timeout since we received response
              if (webViewPongTimeout.current) {
                clearTimeout(webViewPongTimeout.current);
                webViewPongTimeout.current = null;
              }
              
              // WebView is responsive if it can answer pings
              if (!webViewResponsive) {
                console.log('✅ [HEALTHCHECK] WebView recovered - responsive again');
                setWebViewResponsive(true);
              }
            }
          } catch (error) {
            console.log('🚨 [CRASH-DEBUG] Error parsing WebView message - REJECTING Promise:', error);
            setWebViewResponsive(false);
            // REJECT THE PROMISE! Don't be silent!
            sendUIMessage('webWalletStatus', { 
              success: false, 
              error: `Error parsing WebView message: ${error instanceof Error ? error.message : 'Unknown error'}` 
            });
          }
        }}
        onError={(event) => {
          const error = event.nativeEvent;
          const now = Date.now();
          
          // Simple debounce: skip rapid identical errors (max 1 per 3 seconds)
          if (now - lastErrorTime.current < 3000) {
            return;
          }
          lastErrorTime.current = now;
          
          console.log(`🚨 [CRASH-DEBUG] WebView ERROR (handled gracefully):`, JSON.stringify(error, null, 2));
          
          // 🔍 Update state tracking
          setIsReady(false);
          setSiteLoaded(false);
          setWebViewResponsive(false);
          setLastInteraction(Date.now());
          
          // 🚀 SERVER HEALTH: Mark server as unavailable for health checking
          if (error.code === -1001 || error.code === -1004) {
            console.log('🔍 [SERVER-HEALTH] Server connection error (', error.code, ') - starting recovery monitoring');
            setServerAvailable(false);
          }
          
          // 🔍 PROBLEM 5 DEBUG: Android-specific error tracking
          if (Platform.OS === 'android') {
            console.log('🔍 [SCROLL-DEBUG] Android WebView error - may affect scrolling:', {
              errorCode: error.code,
              description: error.description,
              domain: error.domain
            });
          }
          
          // Check if there's an active connection by checking the promise ref from useSophonAccount
          // This is a bit hacky but WebView needs to know about active promises
          console.log('🔍 [CRASH-DEBUG] WebView error occurred, always sending to Promise system');
          
          // Always send error - useSophonAccount will decide if there's an active Promise
          if (error.code === -1001 && uri.includes('localhost:3000')) {
            // Server unavailable error
            console.log('🚀 [CRASH-DEBUG] SENDING webWalletStatus: Server unavailable (-1001)');
            sendUIMessage('webWalletStatus', { 
              success: false, 
              error: 'Server unavailable - localhost:3000 is not accessible. Please start the development server.' 
            });
          } else {
            // Other WebView errors
            console.log('🚀 [CRASH-DEBUG] SENDING webWalletStatus: Other WebView error');
            sendUIMessage('webWalletStatus', { 
              success: false, 
              error: `WebView error: ${error.description || error.code || 'Unknown error'}` 
            });
          }
          
          // ⚠️ Determine if this is a server connection error
          const isServerConnectionError = error.code === -1001 || error.code === -1004 || error.domain === 'NSURLErrorDomain';
          
          // Hide modal only for server connection errors (user should retry)
          if (isServerConnectionError) {
            console.log('🔍 [SERVER-ERROR] Hiding modal due to server connection issue');
            sendUIMessage('hideModal', null);
          }
          
          if (isServerConnectionError) {
            console.log('🚨 [SERVER-ERROR] Server unavailable (', error.code, ') - WebView will retry when server comes back');
            console.log('🔍 [SERVER-ERROR] NOT reloading WebView - waiting for server recovery via health check');
            // NO RELOAD for server errors - health check will handle recovery
          } else {
            // DISABLED: WebView reload disabled to stop recursion
            console.log('🚨 [WEBVIEW-ERROR] WebView error detected but reload DISABLED to prevent loops');
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
        // 🔍 PROBLEM 5 DEBUG: Additional Android lifecycle events
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
