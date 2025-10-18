import { useCallback, useMemo, useState } from 'react';
import type {
  AuthPortalStep,
  NavigateOptions,
  NavigateParams,
  NavigationAuthPortalState,
} from '../types';

const initialState: NavigationAuthPortalState = {
  currentState: null,
  history: [],
  currentParams: null,
};

export function useNavigationAuthPortal() {
  const [state, setConfig] = useState<NavigationAuthPortalState | null>(
    initialState,
  );
  const { history, currentState, currentParams } = state ?? {
    history: [],
    currentState: null,
    currentParams: null,
  };
  const navigate = useCallback(
    (step: AuthPortalStep, options?: NavigateOptions) =>
      setConfig((prev) => {
        if (options?.replace)
          return {
            currentState: step,
            history: [],
            currentParams: {
              ...(prev?.currentParams ?? {}),
              [step]: options?.params || null,
            },
          };

        const stepExists = prev?.history.some(
          (existingStep) => existingStep === step,
        );
        const addInheritParams = options?.inheritParamsFrom?.reduce(
          (acc, inheritStep) => {
            acc[inheritStep] =
              options?.params ||
              prev?.currentParams?.[
                inheritStep as keyof typeof prev.currentParams
              ] ||
              null;
            return acc;
          },
          {},
        );
        return stepExists
          ? prev
          : {
              currentState: step,
              history: [...(prev?.history || []), prev?.currentState].filter(
                Boolean,
              ) as AuthPortalStep[],
              currentParams: {
                ...prev?.currentParams,
                [step]: options?.params || null,
                ...addInheritParams,
              },
            };
      }),
    [],
  );

  const goBack = useCallback((options?: NavigateOptions) => {
    setConfig((prev) => {
      if (!prev || prev.history.length === 0) return prev;
      const newHistory = prev.history.slice(0, -1);
      const newCurrentState = prev.history[prev.history.length - 1];
      if (!newCurrentState) return prev;
      return {
        currentState: newCurrentState,
        history: newHistory,
        currentParams: {
          ...prev.currentParams,
          [newCurrentState]: Object.assign(
            {},
            prev.currentParams?.[
              newCurrentState as keyof typeof prev.currentParams
            ] ?? {},
            options?.params ?? {},
          ),
        },
      };
    });
  }, []);

  const setParams = useCallback(
    (params: NavigateParams) =>
      setConfig((prev) =>
        !prev || !prev.currentParams
          ? prev
          : {
              ...prev,
              currentParams: {
                ...prev.currentParams,
                [prev.currentState]: {
                  ...(prev.currentParams?.[
                    prev.currentState as keyof typeof prev.currentParams
                  ] ?? {}),
                  ...params,
                },
              },
            },
      ),
    [],
  );

  const cleanup = useCallback(() => {
    setConfig(initialState);
  }, []);

  const initializeConfig = useCallback(() => {
    setConfig(initialState);
  }, []);

  const showBackButton = useMemo(
    () => Boolean((state?.history.length ?? 0) > 0),
    [state?.history.length],
  );
  return {
    history,
    currentState,
    currentParams,
    navigate,
    goBack,
    cleanup,
    setParams,
    showBackButton,
    initializeConfig,
  };
}

export type NavigationBottomSheetHook = ReturnType<
  typeof useNavigationAuthPortal
>;
