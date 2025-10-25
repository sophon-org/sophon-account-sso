import BottomSheet, {
  type BottomSheetProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { AdaptiveBottomSheetProvider } from './context/adpative-bottom-sheet.context';
import { ModalSheet, type ModalSheetHandle } from './modal-sheet';

export interface AdaptiveBottomSheetHandle {
  expand: () => void;
  close: () => void;
  snapToIndex: (index: number) => void;
}

export const AdaptiveBottomSheet = forwardRef<
  AdaptiveBottomSheetHandle,
  BottomSheetProps
>(({ children, ...restProps }, ref) => {
  const { width, height } = useWindowDimensions();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const modalSheetRef = useRef<ModalSheetHandle>(null);

  const calculateIsLargeScreen = () => {
    return (
      (Platform.OS === 'ios' && Platform.isPad) ||
      (Platform.OS === 'android' && width > height)
    );
  };

  const prevIsLargeScreen = useRef(calculateIsLargeScreen());

  useImperativeHandle(ref, () => ({
    expand() {
      if (prevIsLargeScreen.current) modalSheetRef.current?.expand();
      else bottomSheetRef.current?.expand?.();
      prevIsLargeScreen.current = calculateIsLargeScreen();
    },
    close() {
      if (prevIsLargeScreen.current) modalSheetRef.current?.close();
      else bottomSheetRef.current?.close?.();
      prevIsLargeScreen.current = calculateIsLargeScreen();
    },
    snapToIndex(index: number) {
      if (prevIsLargeScreen.current) modalSheetRef.current?.snapToIndex(index);
      else bottomSheetRef.current?.snapToIndex?.(index);
    },
  }));

  if (prevIsLargeScreen.current) {
    return (
      <AdaptiveBottomSheetProvider value={{ mode: 'modal' }}>
        <ModalSheet ref={modalSheetRef} onClose={restProps.onClose}>
          {children}
        </ModalSheet>
      </AdaptiveBottomSheetProvider>
    );
  }

  return (
    <AdaptiveBottomSheetProvider value={{ mode: 'bottomSheet' }}>
      <BottomSheet ref={bottomSheetRef} {...restProps}>
        <BottomSheetScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </BottomSheetScrollView>
      </BottomSheet>
    </AdaptiveBottomSheetProvider>
  );
});
