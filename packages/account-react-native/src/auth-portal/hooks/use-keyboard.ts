import { useRef } from 'react';
import { Keyboard, type KeyboardEventName } from 'react-native';

export function useKeyboard() {
  const listenersRef = useRef<
    Map<KeyboardEventName, ReturnType<typeof Keyboard.addListener>>
  >(new Map());

  const addKeyboardListener = (
    event: KeyboardEventName,
    callback: () => void,
  ) => {
    removeKeyboardListener(event);
    const listener = Keyboard.addListener(event, callback);
    listenersRef.current.set(event, listener);
  };

  const removeKeyboardListener = (event?: KeyboardEventName) => {
    if (event) {
      const listener = listenersRef.current.get(event);
      if (listener) {
        listener.remove();
        listenersRef.current.delete(event);
      }
    } else {
      listenersRef.current.forEach((listener) => listener.remove());
      listenersRef.current.clear();
    }
  };

  return {
    addKeyboardListener,
    removeKeyboardListener,
  };
}
