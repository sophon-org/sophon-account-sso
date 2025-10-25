import {
  ANIMATION_STATUS,
  KEYBOARD_STATUS,
  useBottomSheetInternal,
} from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useAdaptiveBottomSheetMode } from '../context/adaptive-bottom-sheet.context';

export function useSafeBottomSheetInternal() {
  const { mode } = useAdaptiveBottomSheetMode();

  if (mode === 'modal') {
    return {
      animatedKeyboardState: {
        value: 1,
        get: () => ({ status: KEYBOARD_STATUS.HIDDEN }),
        set: () => {},
      },
      animatedPosition: { value: 0 },
      animatedAnimationState: {
        value: 0,
        get: () => ({ status: ANIMATION_STATUS.STOPPED }),
      },
      close: () => {},
      expand: () => {},
      snapToIndex: () => {},
    };
  }

  return useBottomSheetInternal();
}

export function useBottomSheetKeyboardFix() {
  const { mode } = useAdaptiveBottomSheetMode();
  const { animatedKeyboardState, animatedAnimationState, animatedPosition } =
    useSafeBottomSheetInternal();
  const isFixingRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'ios' || mode === 'modal') return;

    const sub = Keyboard.addListener('keyboardDidShow', async (event) => {
      const keyboardHeight = event.endCoordinates.height;
      const animState = animatedAnimationState.get();
      const sheetHeight = animatedPosition.value;
      const kbState = animatedKeyboardState.get();

      if (animState.status === ANIMATION_STATUS.RUNNING) {
        setTimeout(() => sub.listener?.(), 100);
        return;
      }

      const screenHeight = event.endCoordinates.screenY || 0;
      const effectiveSheetHeight = screenHeight - sheetHeight;

      const isBottomSheetTooLow = effectiveSheetHeight < keyboardHeight - 20;
      const isKeyboardShown = kbState.status === KEYBOARD_STATUS.SHOWN;

      if (isBottomSheetTooLow && !isFixingRef.current) {
        isFixingRef.current = true;

        console.log('📏 Fixing height: sheet too low than keyboard');

        animatedKeyboardState.set((state) => ({
          ...state,
          status: KEYBOARD_STATUS.HIDDEN,
        }));

        setTimeout(() => {
          animatedKeyboardState.set((state) => ({
            ...state,
            height: keyboardHeight,
            target: keyboardHeight,
            status: KEYBOARD_STATUS.SHOWN,
          }));
          isFixingRef.current = false;
        }, 20);
      }

      if (!isBottomSheetTooLow && isKeyboardShown) {
        animatedKeyboardState.set((state) => ({
          ...state,
          status: KEYBOARD_STATUS.HIDDEN,
        }));
      }
    });

    return () => sub.remove();
  }, [animatedKeyboardState, animatedAnimationState, animatedPosition, mode]);
}
