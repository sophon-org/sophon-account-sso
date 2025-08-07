import { postMessageToWebApp } from '@sophon-labs/account-message-bridge';
import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
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
}
export const SophonMainView = ({
  debugEnabled = false,
  insets,
  authServerUrl,
}: SophonMainViewProps) => {
  const webViewRef = useRef<WebView>(null);
  const { visible } = useModalVisibility();

  const containerStyles = {
    ...styles.container,
    ...(visible ? styles.show : styles.hide),
  };

  useUIEventHandler(
    'showModal',
    useCallback(() => {
      postMessageToWebApp(webViewRef, 'openModal', {});
    }, []),
  );

  useUIEventHandler(
    'outgoingRpc',
    useCallback((payload) => {
      // biome-ignore lint/suspicious/noExplicitAny: future check
      postMessageToWebApp(webViewRef, 'rpc', payload as any);
    }, []),
  );

  return (
    <View style={containerStyles}>
      <WebView
        key={authServerUrl}
        ref={webViewRef}
        source={{ uri: `${authServerUrl}/embedded` }}
        style={{
          ...styles.webview,
          paddingTop: insets?.top,
          paddingBottom: insets?.bottom,
          paddingLeft: insets?.left,
          paddingRight: insets?.right,
        }}
        hideKeyboardAccessoryView={true}
        userAgent={USER_AGENT}
        webviewDebuggingEnabled={debugEnabled}
        // onLoadEnd={() => console.log('load end')}
        // onLoadStart={() => console.log('load start')}
        // onLoad={() => console.log('load')}
        onMessage={(event) => {
          const { action, payload } = JSON.parse(event.nativeEvent.data);
          console.log('❤️ ❤️ ❤️ ❤️ receiving message', action, payload);
          if (action === 'closeModal') {
            sendUIMessage('hideModal', payload);
          } else if (action === 'rpc') {
            sendUIMessage('incomingRpc', payload);
          } else if (action === 'account.token.emitted') {
            sendUIMessage('setToken', payload);
          } else if (action === 'logout') {
            sendUIMessage('logout', payload);
          }
        }}
        onError={(event) => {
          console.error(event);
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
