import { useRef } from 'react';
import { Keyboard, type KeyboardEventName } from 'react-native';

export function useKeyboard() {
  const listenerRef = useRef<ReturnType<typeof Keyboard.addListener> | null>(
    null,
  );

  const addKeyboardListener = (
    event: KeyboardEventName,
    callback: () => void,
  ) => {
    removeKeyboardListener();
    listenerRef.current = Keyboard.addListener(event, callback);
  };

  const removeKeyboardListener = () => {
    if (listenerRef.current) {
      listenerRef.current.remove();
      listenerRef.current = null;
    }
  };

  return {
    addKeyboardListener,
    removeKeyboardListener,
  };
}
