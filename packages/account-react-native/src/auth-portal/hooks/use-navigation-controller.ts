import { useCallback, useState } from 'react';
import type {
  AuthPortalStep,
  CurrentParams,
  NavigateOptions,
  NavigateParams,
  NavigationAuthPortalState,
} from '../types';

const initialState: NavigationAuthPortalState = {
  currentState: null,
  history: [],
  currentParams: null,
};

export const useNavigationController = () => {
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
        if (!prev) return initialState;

        if (options?.replace) {
          return {
            ...(prev || {}),
            currentState: step,
            history: [],
            currentParams: options?.params
              ? {
                  ...(prev?.currentParams ?? {}),
                  [step]: options?.params || null,
                }
              : prev?.currentParams,
          };
        }

        const stepExists = prev?.history.some(
          (existingStep: AuthPortalStep) => existingStep === step,
        );

        if (stepExists) return prev;

        const addInheritParams = (options?.inheritParamsFrom ?? []).reduce<
          Partial<Record<keyof CurrentParams, unknown>>
        >((acc, inheritStep) => {
          acc[inheritStep] =
            options?.params ?? prev?.currentParams?.[inheritStep] ?? undefined;
          return acc;
        }, {}) as CurrentParams;

        const _currentParams = {
          ...(prev?.currentParams ?? {}),
          [step]: options?.params || null,
          ...(addInheritParams ?? {}),
        };
        const _history = [
          ...(prev?.history || []),
          prev?.currentState || 'signIn',
        ].filter(Boolean) as AuthPortalStep[];

        return {
          currentState: step,
          history: _history,
          currentParams: _currentParams,
        };
      }),
    [],
  );

  const cleanup = useCallback(() => {
    setConfig(initialState);
  }, []);

  const goBack = useCallback((options?: NavigateOptions) => {
    setConfig((prev) => {
      if (prev?.currentState === 'retry') return initialState;

      if (!prev || prev.history.length === 0) return prev;

      const newHistory = prev.history.slice(0, -1);
      const newCurrentState = prev.history[prev.history.length - 1];

      if (newCurrentState === 'signIn') return initialState;
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
                [prev.currentState!]: {
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

  const initializeConfig = useCallback(() => {
    setConfig(initialState);
  }, []);

  return {
    history,
    currentState,
    currentParams,
    navigate,
    goBack,
    cleanup,
    setParams,
    initializeConfig,
  };
};

export type NavigationControllerHook = ReturnType<
  typeof useNavigationController
>;
