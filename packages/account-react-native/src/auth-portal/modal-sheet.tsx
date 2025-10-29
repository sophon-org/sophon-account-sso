import type React from 'react';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { type ThemeColorType, useThemedStyles } from '../ui/theme-provider';
import { AuthPortalBottomSheetHandle } from './components/custom-sheet-handle';
import { useAuthPortal } from './hooks';

export type ModalSheetHandle = {
  expand: () => void;
  close: () => void;
  snapToIndex: (index: number) => void;
};

export interface ModalSheetProps {
  children: React.ReactNode;
  onClose?: () => void;
  dismissOnBackdropPress?: boolean;
  widthPercent?: number; // modal width relative to screen (default: 0.7)
  maxHeightPercent?: number; // modal max height relative to screen (default: 0.85)
}

const MAX_WIDTH = 500;
const MIN_WIDTH = 360;

export const ModalSheet = forwardRef<ModalSheetHandle, ModalSheetProps>(
  ({ children, widthPercent = 0.7, maxHeightPercent = 0.85 }, ref) => {
    const styles = useThemedStyles(createStyles);
    const { handleProps, goBack, requestClose } = useAuthPortal();
    const [visible, setVisible] = useState(false);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.96);
    const translateY = useSharedValue(30);
    const { width, height } = useWindowDimensions();

    const animateIn = useCallback(() => {
      opacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      translateY.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
      scale.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
    }, [translateY, scale, opacity]);

    const animateOut = useCallback(
      (callback?: () => void) => {
        opacity.value = withTiming(0, {
          duration: 200,
          easing: Easing.in(Easing.cubic),
        });
        translateY.value = withTiming(20, {
          duration: 200,
          easing: Easing.in(Easing.cubic),
        });
        scale.value = withTiming(
          0.95,
          { duration: 200, easing: Easing.in(Easing.cubic) },
          () => runOnJS(callback ?? (() => {}))(),
        );
      },
      [translateY, scale, opacity],
    );

    const expand = useCallback(() => {
      console.log('[ModalSheet] Expand called');
      setVisible(true);
      animateIn();
    }, [animateIn]);

    const close = useCallback(() => {
      if (!visible) return;
      console.log('[ModalSheet] Close called');
      animateOut(() => {
        setVisible(false);
        requestClose?.();
      });
    }, [animateOut, requestClose, visible]);

    const snapToIndex = useCallback(
      (index: number) => {
        if (index === 0 && !visible) expand();
      },
      [expand, visible],
    );

    useImperativeHandle(ref, () => ({
      expand,
      close,
      snapToIndex,
    }));

    const backdropStyle = useAnimatedStyle(() => ({
      opacity: opacity.value * 0.4,
    }));

    const modalAnimatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    }));

    const modalWidth = useMemo(
      () =>
        width *
        (Platform.OS === 'ios' && Platform.isPad
          ? Math.min(0.6, widthPercent)
          : widthPercent),
      [width, widthPercent],
    );

    const modalMaxHeight = useMemo(
      () => height * maxHeightPercent,
      [height, maxHeightPercent],
    );

    if (!visible) return null;

    return (
      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={close}
      >
        <TouchableWithoutFeedback
          onPress={close}
          disabled={handleProps.hideCloseButton}
        >
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centered}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                width: modalWidth,
                maxWidth: MAX_WIDTH,
                minWidth: MIN_WIDTH,
                maxHeight: modalMaxHeight,
              },
              modalAnimatedStyle,
            ]}
          >
            <AuthPortalBottomSheetHandle
              {...handleProps}
              goBack={goBack}
              close={close}
              style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
            />
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    );
  },
);

const createStyles = (colors: ThemeColorType) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.surface,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: colors.background.primary,
      borderRadius: 24,
      elevation: 8,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    scrollContent: {
      flexGrow: 1,
      backgroundColor: colors.background.primary,
      borderBottomLeftRadius: 24,
      borderBottomStartRadius: 24,
      borderBottomEndRadius: 24,
      borderBottomRightRadius: 24,
    },
    modalContent: {
      backgroundColor: colors.background.primary,
    },
  });
