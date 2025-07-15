import { WebView, type WebViewProps } from 'react-native-webview';
import { USER_AGENT } from './constants/user-agent';
// import { BottomSheetView } from '@gorhom/bottom-sheet';
// import { StyleSheet } from 'react-native';
import { Modal } from 'react-native';
import { useEffect, type ComponentType } from 'react';
import { useSophonContext } from './hooks';
// import { View } from 'react-native';

export interface SophonWebViewProps {
  // url: string;
  style?: WebViewProps['style'];
  webViewRef?: React.RefObject<WebView | null>;
  // modalRef?: React.RefObject<Modal>;
  // isModalVisible: boolean;
}

// export const SophonAccountProvider = ({
//   children,
// }: {
//   children: React.ReactNode;
// }) => {
//   return (
//     <GestureHandlerRootView style={styles.container}>
//       <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
//     </GestureHandlerRootView>
//   );
// };

const ModalSafeForReact18 = Modal as ComponentType<Modal['props']>;

const WebViewSafeForReact18 = WebView as any;

export const SophonModal = ({ style, webViewRef }: SophonWebViewProps) => {
  // const handleSheetChanges = useCallback((index: number) => {
  //   console.log('handleSheetChanges', index);
  // }, []);

  useEffect(() => {
    console.log('webViewRef def', webViewRef, webViewRef?.current);
  }, [webViewRef]);
  console.log('webViewRef def3', webViewRef, webViewRef?.current);

  const url = 'http://localhost:3000';
  const { isModalVisible, hideModal } = useSophonContext();

  console.log('isModalVisible 2', isModalVisible);
  return (
    <ModalSafeForReact18
      // ref={modalRef}
      // transparent={true}
      animationType="slide"
      onRequestClose={() => {
        hideModal();
      }}
      visible={isModalVisible}
      // isVisible={isModalVisible}
      presentationStyle="pageSheet"
      onShow={() => {
        console.log('onShow');
      }}
      // visible={isModalVisible}
      // useNativeDriver={true}
      // useNativeDriverForBackdrop={true}
      // hideModalContentWhileAnimating={true}
      // animationIn="slideInUp"
      // animationOut="slideOutDown"
    >
      {/* <ActionSheet
      ref={modalRef}
      // snapPoints={[800]}
      testIDs={{
        backdrop: 'sophon-account-bottom-sheet-backdrop',
        modal: 'sophon-account-bottom-sheet-modal',
        sheet: 'sophon-account-bottom-sheet-sheet',
        root: 'sophon-account-bottom-sheet-root',
      }}
    > */}
      {/* <View> */}
      {/* <BottomSheetModal
        ref={modalRef}
        onChange={handleSheetChanges}
        enableDynamicSizing={false}
        snapPoints={[900]}
      > */}
      {/* <BottomSheetView
        style={styles.contentContainer}
        testID="sophon-account-bottom-sheet-view"
      > */}
      <WebViewSafeForReact18
        testID="sophon-account-webview"
        ref={webViewRef}
        // ref={(ref) => {
        //   console.log('ref', ref);
        // }}
        source={{ uri: url }}
        style={[{ flex: 1 }, style]}
        userAgent={USER_AGENT}
        onMessage={(event: any) => {
          const { action, payload } = JSON.parse(event.nativeEvent.data);
          console.warn(action, payload);
          if (action === 'connected') {
            hideModal();
          }
        }}
      />
      {/* </View> */}
      {/* </BottomSheetView> */}
      {/* </BottomSheetModal> */}
      {/* </ActionSheet> */}
    </ModalSafeForReact18>
  );
};

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 24,
//     justifyContent: 'center',
//     backgroundColor: 'grey',
//   },
//   contentContainer: {
//     flex: 1,
//     alignItems: 'center',
//   },
// });
