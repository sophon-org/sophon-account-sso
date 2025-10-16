import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetHandle,
  type BottomSheetHandleProps,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Keyboard, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useUIEventHandler } from '../../messaging/ui';
import { StepProvider } from '.';
import type {
  AuthBottomSheetProps,
  AuthBottomSheetStep,
  AuthSheetContextType,
} from './types';

const AuthSheetContext = createContext<AuthSheetContextType | null>(null);

export function AuthBottomSheet(props: AuthBottomSheetProps) {
  const [stepHistory, setStepHistory] = useState<AuthBottomSheetStep[]>([
    'signIn',
  ]);

  const goTo = (step: AuthBottomSheetStep) =>
    setStepHistory((prev) => [...prev, step]);
  const goBack = () =>
    setStepHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  const bottomSheetRef = useRef<BottomSheet>(null);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  const showModal = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);
  const hideModal = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);
  const onClose = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const renderHandleComponent = useCallback(
    (props: BottomSheetHandleProps) => {
      return (
        <BottomSheetHandle {...props}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            {!stepHistory[stepHistory.length - 1]?.includes('signIn') ? (
              <TouchableOpacity
                style={{ position: 'absolute', left: 24 }}
                onPress={goBack}
                hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
              >
                <Text style={{ fontSize: 24, fontWeight: '600' }}>←</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={{ fontWeight: '700', fontSize: 18, lineHeight: 24 }}>
              Sign in
            </Text>
            <TouchableOpacity
              style={{ position: 'absolute', right: 24 }}
              onPress={hideModal}
              hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
            >
              <Text style={{ fontSize: 24, fontWeight: '600' }}>X</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 1, backgroundColor: '#eee' }} />
        </BottomSheetHandle>
      );
    },
    [stepHistory, hideModal, goBack],
  );

  useUIEventHandler('showModal', () => {
    showModal();
  });
  useUIEventHandler('hideModal', () => {
    hideModal();
  });

  return (
    <BottomSheetModalProvider>
      <AuthSheetContext.Provider
        value={{
          currentStep: stepHistory[stepHistory.length - 1] ?? 'signIn',
          goTo,
          goBack,
          ...props,
        }}
      >
        <BottomSheet
          onClose={onClose}
          ref={bottomSheetRef}
          backdropComponent={renderBackdrop}
          handleComponent={renderHandleComponent}
          topInset={props.insets?.top ?? 0}
          index={-1}
          enablePanDownToClose
          enableDynamicSizing={true}
          keyboardBehavior={
            Platform.OS === 'ios' ? 'fillParent' : 'interactive'
          }
          keyboardBlurBehavior="restore"
          enableBlurKeyboardOnGesture
          android_keyboardInputMode="adjustResize"
          handleIndicatorStyle={{ backgroundColor: '#ccc' }}
        >
          <StepProvider />
        </BottomSheet>
      </AuthSheetContext.Provider>
    </BottomSheetModalProvider>
  );
}

export function useAuthSheet() {
  const context = useContext(AuthSheetContext);
  if (!context)
    throw new Error('useAuthSheet must be used within AuthBottomSheetProvider');
  return context;
}
