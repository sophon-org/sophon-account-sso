import { postMessageToWebApp } from '@sophon-labs/account-message-bridge';
import React, { useCallback, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { VIEW_VERSION } from '../constants';
import { USER_AGENT } from '../constants/user-agent';
import { useModalVisibility } from '../hooks/use-modal-visibility';
import { sendUIMessage, useUIEventHandler } from '../messaging/ui';

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
  hasInternet: boolean;
}
export const SophonMainView = ({
  debugEnabled = false,
  insets,
  authServerUrl,
  partnerId,
}: SophonMainViewProps) => {
  const webViewRef = useRef<WebView>(null);
  const { visible } = useModalVisibility();
  const [isReady, setIsReady] = useState(false);
  const [siteLoaded, setSiteLoaded] = useState(false); // ← САЙТ ДЕЙСТВИТЕЛЬНО ЗАГРУЖЕН?

  const containerStyles = {
    ...styles.container,
    ...(visible ? styles.show : styles.hide),
  };



  useUIEventHandler(
    'showModal',
    useCallback(() => {
      // postMessageToWebApp doesn't throw exceptions - check manually
      if (!webViewRef.current) {
        console.error('🔥 WebView ref is null - REJECTING Promise');
        sendUIMessage('webWalletStatus', { 
          success: false, 
          error: 'WebView not available - cannot show modal' 
        });
        return;
      }
      
      if (!isReady || !siteLoaded) {
        console.error('🔥 WebView not ready or site not loaded - REJECTING Promise');
        sendUIMessage('webWalletStatus', { 
          success: false, 
          error: !isReady ? 'WebView not ready - cannot show modal' : 'Wallet site not loaded in WebView'
        });
        return;
      }
      
      console.log('🚀 Sending openModal to WebView...');
      postMessageToWebApp(webViewRef, 'openModal', {});
      // Note: postMessageToWebApp never throws - it logs errors internally
    }, [isReady, siteLoaded]),
  );

  useUIEventHandler(
    'outgoingRpc',
    useCallback(
      (payload) => {
        console.log('🔥 Sending RPC to WebView:', { 
          payload: JSON.stringify(payload, null, 2), 
          isReady, 
          siteLoaded,
          hasWebViewRef: !!webViewRef.current 
        });
        if (!isReady || !siteLoaded) {
          console.log('❌ WebView not ready or site not loaded, cannot send RPC - REJECTING Promise');
          // REJECT THE PROMISE! Don't be silent!
          sendUIMessage('webWalletStatus', { 
            success: false, 
            error: !isReady ? 'WebView not ready to send RPC request' : 'Wallet site not loaded in WebView'
          });
          return;
        }
        // postMessageToWebApp doesn't throw - check WebView state manually
        if (!webViewRef.current) {
          console.error('🔥 WebView ref is null - REJECTING Promise');
          sendUIMessage('webWalletStatus', { 
            success: false, 
            error: 'WebView not available - cannot send RPC' 
          });
          return;
        }

        console.log('🚀 About to postMessageToWebApp:', { action: 'rpc', payload });
        // biome-ignore lint/suspicious/noExplicitAny: future check
        postMessageToWebApp(webViewRef, 'rpc', payload as any);
        // Note: postMessageToWebApp never throws - it logs errors internally
      },
      [isReady, siteLoaded],
    ),
  );

  const params = new URLSearchParams();
  if (partnerId) {
    params.set('version', VIEW_VERSION);
    params.set('platformOS', Platform.OS);
    params.set('platformVersion', `${Platform.Version}`);
  }

  const uri = `${authServerUrl}/embedded/${partnerId}?${params.toString()}`;
  console.log('🔥 WebView loading URL:', uri); // Force nodemon rebuild

  return (
    <View style={containerStyles}>
      <WebView
        key={authServerUrl}
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
        onLoadEnd={() => {
          console.log('🔥 WebView LOADED:', uri);
          setIsReady(true);
          
          // Check if our wallet site actually loaded (not an error page)
          // We'll know this when we receive the first message from the site
          console.log('🔍 WebView loaded, waiting for site confirmation...');
        }}
        scrollEnabled={false}
        // textZoom={0}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        nestedScrollEnabled={false}
        overScrollMode="never"
        bounces={false}
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
            console.log('🔥 WebView received message:', { 
              action, 
              payload: JSON.stringify(payload, null, 2) 
            });
            
            // First message from site = site is loaded and working!
            if (!siteLoaded) {
              console.log('✅ First message from wallet site - site is loaded!');
              setSiteLoaded(true);
            }
            
            if (action === 'closeModal') {
              sendUIMessage('hideModal', payload);
            } else if (action === 'rpc') {
              // Check for auth result in RPC response
              const hasError = payload?.content?.error;
              const result = payload?.content?.result;
              
              if (hasError) {
                const errorMessage = hasError.message || hasError.toString() || 'RPC method failed';
                sendUIMessage('webWalletStatus', { 
                  success: false, 
                  error: errorMessage 
                });
              } else if (result) {
                sendUIMessage('webWalletStatus', { 
                  success: true, 
                  account: result 
                });
              }
              
              sendUIMessage('incomingRpc', payload);
            } else if (action === 'account.token.emitted') {
              sendUIMessage('setToken', payload);
            } else if (action === 'logout') {
              sendUIMessage('logout', payload);
            }
          } catch (error) {
            console.error('🔥 Error parsing WebView message - REJECTING Promise:', error);
            // REJECT THE PROMISE! Don't be silent!
            sendUIMessage('webWalletStatus', { 
              success: false, 
              error: `Error parsing WebView message: ${error instanceof Error ? error.message : 'Unknown error'}` 
            });
          }
        }}
        onError={(event) => {
          const error = event.nativeEvent;
          console.error('🔥 WebView ERROR:', JSON.stringify(error, null, 2));
          setIsReady(false);
          setSiteLoaded(false); // Site definitely not loaded if there's an error
          
          // Send specific error types to Promise
          if (error.code === -1001 && uri.includes('localhost:3000')) {
            // Server unavailable error
            console.log('🚀 SENDING webWalletStatus: Server unavailable (-1001)');
            sendUIMessage('webWalletStatus', { 
              success: false, 
              error: 'Server unavailable - localhost:3000 is not accessible. Please start the development server.' 
            });
          } else {
            // Other WebView errors
            console.log('🚀 SENDING webWalletStatus: Other WebView error');
            sendUIMessage('webWalletStatus', { 
              success: false, 
              error: `WebView error: ${error.description || error.code || 'Unknown error'}` 
            });
          }
          
          console.log('🚀 Hiding modal after WebView error');
          sendUIMessage('hideModal', null);
        }}
        onContentProcessDidTerminate={() => {}}
        onRenderProcessGone={() => {}}
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
