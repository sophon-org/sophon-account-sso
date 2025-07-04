import { WebView, type WebViewProps } from 'react-native-webview';
import { USER_AGENT } from './constants/user-agent';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { StyleSheet } from 'react-native';
import { useCallback, useRef } from 'react';

export interface SophonWebViewProps {
  url: string;
  style?: WebViewProps['style'];
  webViewRef?: React.RefObject<WebView>;
  modalRef?: React.RefObject<BottomSheetModal>;
}

export const SophonAccountProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export const SophonWebView = ({
  style,
  url,
  webViewRef,
  modalRef,
}: SophonWebViewProps) => {
  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

  return (
    <BottomSheetModal ref={modalRef} onChange={handleSheetChanges}>
      <BottomSheetView style={styles.contentContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={[{ flex: 1 }, style]}
          userAgent={USER_AGENT}
          onMessage={(event) => {
            console.warn(event.nativeEvent.data);
          }}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export const useSophonAccount = (
  { url }: { url: string } = { url: 'http://localhost:3000' }
) => {
  const modalRef = useRef<BottomSheetModal>(null);
  const webviewRef = useRef<WebView>(null);

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    modalRef.current?.present();
  }, []);

  return {
    showModal: handlePresentModalPress,
    modal: (
      <SophonWebView
        url={url}
        webViewRef={webviewRef as any}
        modalRef={modalRef as any}
      />
    ),
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'grey',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
});
