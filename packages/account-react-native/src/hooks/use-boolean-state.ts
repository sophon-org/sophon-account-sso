import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useState,
} from 'react';

export interface BooleanStateHook {
  state: boolean;
  setOn: () => void;
  setOff: () => void;
  toggle: () => void;
  setState: Dispatch<SetStateAction<boolean>>;
}
export const useBooleanState = (initialState = false): BooleanStateHook => {
  const [state, setState] = useState(initialState);

  const setOn = useCallback(() => {
    setState(true);
  }, [setState]);

  const setOff = useCallback(() => {
    setState(false);
  }, [setState]);

  const toggle = useCallback(() => {
    setState((state) => !state);
  }, [setState]);

  return {
    state,
    setOn,
    setOff,
    setState,
    toggle,
  };
};
