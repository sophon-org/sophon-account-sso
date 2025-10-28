import BottomSheet, {
  type BottomSheetProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import {
  forwardRef,
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

  const [initialMode, setInitialMode] = useState<
    'modal' | 'bottomSheet' | null
  >(null);

  const isLargeScreen = useMemo(() => {
    return (
      (Platform.OS === 'ios' && Platform.isPad) ||
      (Platform.OS === 'android' && width > height)
    );
  }, [width, height]);

  const mode = useMemo(() => {
    if (!initialMode) {
      return isLargeScreen ? 'modal' : 'bottomSheet';
    }
    return initialMode;
  }, [initialMode, isLargeScreen]);

  useImperativeHandle(
    ref,
    () => ({
      expand() {
        const newMode = isLargeScreen ? 'modal' : 'bottomSheet';
        setInitialMode(newMode);
        console.log('[AdaptiveBottomSheet]: Expanding sheet', newMode);
        if (newMode === 'modal') {
          modalSheetRef.current?.expand();
        } else {
          bottomSheetRef.current?.expand?.();
        }
      },
      close() {
        console.log('[AdaptiveBottomSheet]: Closing sheet', mode);
        if (mode === 'modal') {
          modalSheetRef.current?.close();
        } else {
          bottomSheetRef.current?.close?.();
        }
        setInitialMode(null);
      },
      snapToIndex(index: number) {
        if (mode === 'bottomSheet') {
          console.log('[AdaptiveBottomSheet]: Snapping to index', index);
          bottomSheetRef.current?.snapToIndex?.(index);
        }
      },
    }),
    [mode, isLargeScreen],
  );

  const contextValue = useMemo(() => ({ mode }), [mode]);

  if (mode === 'modal') {
    return (
      <AdaptiveBottomSheetProvider value={contextValue}>
        <ModalSheet ref={modalSheetRef} onClose={restProps.onClose}>
          {children}
        </ModalSheet>
      </AdaptiveBottomSheetProvider>
    );
  }

  return (
    <AdaptiveBottomSheetProvider value={contextValue}>
      <BottomSheet ref={bottomSheetRef} {...restProps}>
        <BottomSheetScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ backgroundColor: colors.background.primary }}
        >
          {children}
        </BottomSheetScrollView>
      </BottomSheet>
    </AdaptiveBottomSheetProvider>
  );
});
