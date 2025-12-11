import BottomSheet, {
  type BottomSheetProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useThemeColors } from '../ui/theme-provider';
import { AdaptiveBottomSheetProvider } from './context/adaptive-bottom-sheet.context';
import { ModalSheet, type ModalSheetHandle } from './modal-sheet';

export interface AdaptiveBottomSheetHandle {
  expand: () => void;
  close: () => void;
  forceClose: () => void;
  snapToIndex: (index: number) => void;
}

export const AdaptiveBottomSheet = forwardRef<
  AdaptiveBottomSheetHandle,
  BottomSheetProps
>(({ children, ...restProps }, ref) => {
  const colors = useThemeColors();
  const { width, height } = useWindowDimensions();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const modalSheetRef = useRef<ModalSheetHandle>(null);

  const isLargeScreen = useMemo(() => {
    const isPad = Platform.OS === 'ios' && Platform.isPad;
    const isLandscapeTablet = Platform.OS === 'android' && width > height;
    return isPad || isLandscapeTablet;
  }, [width, height]);

  const [isModal, setIsModal] = useState(
    Platform.OS === 'ios' && Platform.isPad,
  );
  const pendingExpandRef = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      expand() {
        const useModal = isLargeScreen;
        setIsModal(useModal);
        pendingExpandRef.current = isModal !== useModal;
        if (isModal !== useModal) return;
        if (useModal) modalSheetRef.current?.expand();
        else bottomSheetRef.current?.expand();
      },
      close() {
        pendingExpandRef.current = false;
        if (isModal) {
          modalSheetRef.current?.close();
        } else {
          bottomSheetRef.current?.close();
        }
      },
      snapToIndex(index: number) {
        if (!isModal && bottomSheetRef.current) {
          bottomSheetRef.current.snapToIndex(index);
        }
      },
      forceClose() {
        pendingExpandRef.current = false;
        bottomSheetRef.current?.forceClose();
        modalSheetRef.current?.close();
        setIsModal(isLargeScreen);
      },
    }),
    [isModal, isLargeScreen],
  );

  useEffect(() => {
    if (!pendingExpandRef.current) return;
    pendingExpandRef.current = false;
    const current = setTimeout(() => {
      if (isModal) modalSheetRef.current?.expand();
      else bottomSheetRef.current?.expand();
    }, 80);

    return () => clearTimeout(current);
  }, [isModal]);

  if (isModal) {
    return (
      <AdaptiveBottomSheetProvider value={{ mode: 'modal' }}>
        <ModalSheet
          ref={modalSheetRef}
          onClose={() => {
            restProps.onClose?.();
            setIsModal(isLargeScreen);
          }}
        >
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
          keyboardShouldPersistTaps={'handled'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ backgroundColor: colors.background.primary }}
        >
          {children}
        </BottomSheetScrollView>
      </BottomSheet>
    </AdaptiveBottomSheetProvider>
  );
});
