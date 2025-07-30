import { postMessageToWebApp } from '@sophon-labs/account-message-bridge';
import { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { USER_AGENT } from './constants/user-agent';
import { useModalVisibility } from './hooks/use-modal-visibility';
import { sendUIMessage, useUIEventHandler } from './messaging/ui';

const defaultUrl = 'http://localhost:3000/webview';

export interface SophonMainViewProps {
  url?: string;
  debugEnabled?: boolean;
}
export const SophonMainView = ({
  url = defaultUrl,
  debugEnabled = false,
}: SophonMainViewProps) => {
  const { top, bottom } = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const { visible } = useModalVisibility();

  const containerStyles = {
    ...styles.container,
    ...(visible ? styles.show : styles.hide),
  };

  const key = useMemo(() => url.toString(), [url]);

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
        key={key}
        ref={webViewRef}
        source={{ uri: defaultUrl }}
        style={{ ...styles.webview, paddingTop: top, paddingBottom: bottom }}
        hideKeyboardAccessoryView={true}
        userAgent={USER_AGENT}
        webviewDebuggingEnabled={debugEnabled}
        onLoadEnd={() => console.log('load end')}
        onLoadStart={() => console.log('load start')}
        onLoad={() => console.log('load')}
        onMessage={(event) => {
          const { action, payload } = JSON.parse(event.nativeEvent.data);
          if (action === 'closeModal') {
            sendUIMessage('hideModal', payload);
          } else if (action === 'rpc') {
            sendUIMessage('incomingRpc', payload);
          }
        }}
        onError={(event) => {
          console.error(event);
        }}
        onContentProcessDidTerminate={() => {
          console.log('content process did terminate');
        }}
        onRenderProcessGone={() => {
          console.log('render process gone');
        }}
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
