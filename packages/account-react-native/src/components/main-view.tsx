import { postMessageToWebApp } from '@sophon-labs/account-message-bridge';
import { useCallback, useRef, useState } from 'react';
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
    useCallback(
      (payload) => {
        // biome-ignore lint/suspicious/noExplicitAny: future check
        postMessageToWebApp(webViewRef, 'rpc', payload as any);
      },
      [isReady],
    ),
  );

  const params = new URLSearchParams();
  if (partnerId) {
    params.set('version', VIEW_VERSION);
    params.set('platformOS', Platform.OS);
    params.set('platformVersion', `${Platform.Version}`);
  }

  const uri = `${authServerUrl}/embedded/${partnerId}?${params.toString()}`;

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
          setIsReady(true);
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
          const { action, payload } = JSON.parse(event.nativeEvent.data);
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
