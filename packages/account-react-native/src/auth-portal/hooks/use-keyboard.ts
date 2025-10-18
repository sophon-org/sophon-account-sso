import { useEffect, useRef, useState } from 'react';
import { Keyboard, type KeyboardEventName } from 'react-native';

export function useKeyboard() {
  const [keyboardOffSet, setKeyboardOffSet] = useState(0);
  useEffect(() => {
    const listenerShow = Keyboard.addListener('keyboardWillShow', (event) => {
      setKeyboardOffSet((event?.endCoordinates?.height || 0) * 0.5);
    });
    const listenerHide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardOffSet(0);
    });
    return () => {
      listenerShow.remove();
      listenerHide.remove();
    };
  }, []);
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
    keyboardOffSet,
    addKeyboardListener,
    removeKeyboardListener,
  };
}
