import { useCallback, useMemo, useState } from 'react';
import type {
  AuthPortalStep,
  CurrentParams,
  NavigateOptions,
  NavigateParams,
  NavigationAuthPortalState,
} from '../types';

// Generic types for the navigation controller
export type NavigationState<
  TStep extends string = string,
  TParams extends Record<string, unknown> = Record<string, unknown>,
> = {
  currentState: TStep | null;
  history: TStep[];
  currentParams: TParams | null;
};

export type NavigateOptionsGeneric<
  TStep extends string = string,
  TParamsUnion = unknown,
> = {
  replace?: boolean;
  params?: TParamsUnion;
  inheritParamsFrom?: TStep[];
};

export type NavigationControllerConfig<TStep extends string = string> = {
  defaultStep?: TStep;
  resetSteps?: TStep[];
};

/**
 * Generic navigation controller hook
 * @template TStep - Union type of step identifiers
 * @template TParams - Record type mapping steps to their params
 * @template TParamsUnion - Union type of all possible parameter types
 */
export function useNavigationController<
  TStep extends string = AuthPortalStep,
  TParams extends Record<string, unknown> = CurrentParams,
  TParamsUnion = NavigateParams,
>(
  config?: NavigationControllerConfig<TStep> | undefined,
): NavigationControllerHook<TStep, TParams, TParamsUnion> {
  const initialState = useMemo<NavigationState<TStep, TParams>>(
    () => ({
      currentState: null,
      history: [],
      currentParams: null,
    }),
    [],
  );

  const [state, setConfig] = useState<NavigationState<TStep, TParams> | null>(
    initialState,
  );

  const { history, currentState, currentParams } = state ?? {
    history: [] as TStep[],
    currentState: null as TStep | null,
    currentParams: null as TParams | null,
  };

  const navigate = useCallback(
    (step: TStep, options?: NavigateOptionsGeneric<TStep, TParamsUnion>) =>
      setConfig((prev) => {
        if (!prev) return initialState;

        if (options?.replace) {
          return {
            ...(prev || {}),
            currentState: step,
            history: [] as TStep[],
            currentParams: options?.params
              ? ({
                  ...(prev?.currentParams ?? {}),
                  [step]: options?.params || null,
                } as TParams)
              : prev?.currentParams,
          } as NavigationState<TStep, TParams>;
        }

        const stepExists = prev?.history.some(
          (existingStep: TStep) => existingStep === step,
        );

        if (stepExists) return prev;

        const addInheritParams = (options?.inheritParamsFrom ?? []).reduce<
          Partial<Record<keyof TParams, unknown>>
        >((acc, inheritStep) => {
          acc[inheritStep as keyof TParams] =
            options?.params ??
            prev?.currentParams?.[inheritStep as keyof TParams] ??
            undefined;
          return acc;
        }, {}) as Partial<TParams>;

        const _currentParams = {
          ...(prev?.currentParams ?? {}),
          [step]: options?.params || null,
          ...(addInheritParams ?? {}),
        } as TParams;

        const _history = [
          ...(prev?.history || []),
          prev?.currentState ||
            (config?.defaultStep as TStep) ||
            ('signIn' as TStep),
        ].filter(Boolean) as TStep[];

        return {
          currentState: step,
          history: _history,
          currentParams: _currentParams,
        } as NavigationState<TStep, TParams>;
      }),
    [config?.defaultStep, initialState],
  );

  const cleanup = useCallback(() => {
    setConfig(initialState);
  }, [initialState]);

  const goBack = useCallback(
    (options?: NavigateOptionsGeneric<TStep, TParamsUnion>) => {
      setConfig((prev) => {
        // Check if current step is in reset steps
        if (config?.resetSteps?.includes(prev?.currentState as TStep)) {
          return initialState;
        }

        if (!prev || prev.history.length === 0) return prev;

        const newHistory = prev.history.slice(0, -1);
        const newCurrentState = prev.history[prev.history.length - 1];

        // Check if going back to default step
        if (newCurrentState === (config?.defaultStep || 'signIn'))
          return initialState;
        if (!newCurrentState) return prev;

        return {
          currentState: newCurrentState,
          history: newHistory,
          currentParams: {
            ...prev.currentParams,
            [newCurrentState]: Object.assign(
              {},
              prev.currentParams?.[newCurrentState as keyof TParams] ?? {},
              options?.params ?? {},
            ),
          } as TParams,
        } as NavigationState<TStep, TParams>;
      });
    },
    [config?.defaultStep, config?.resetSteps, initialState],
  );

  const setParams = useCallback(
    (params: TParamsUnion, currentStep?: TStep) =>
      setConfig((prev) => {
        if (!prev) return prev;

        const targetState = currentStep || prev.currentState;
        if (!targetState) return prev;

        return {
          ...prev,
          currentState: currentStep ?? prev.currentState,
          currentParams: {
            ...(prev.currentParams ?? {}),
            [targetState]: {
              ...(prev.currentParams?.[targetState as keyof TParams] ?? {}),
              ...params,
            },
          } as TParams,
        };
      }),
    [],
  );

  const initializeConfig = useCallback(() => {
    setConfig(initialState);
  }, [initialState]);

  return {
    history: history as TStep[],
    currentState,
    currentParams,
    navigate,
    goBack,
    cleanup,
    setParams,
    initializeConfig,
  };
}

export type NavigationControllerHook<
  TStep extends string = AuthPortalStep,
  TParams extends Record<string, unknown> = CurrentParams,
  TParamsUnion = NavigateParams,
> = {
  history: TStep[];
  currentState: TStep | null;
  currentParams: TParams | null;
  navigate: (
    step: TStep,
    options?: NavigateOptionsGeneric<TStep, TParamsUnion>,
  ) => void;
  goBack: (options?: NavigateOptionsGeneric<TStep, TParamsUnion>) => void;
  cleanup: () => void;
  setParams: (params: TParamsUnion, currentStep?: TStep) => void;
  initializeConfig: () => void;
};

// Specific type for AuthPortal navigation
export type AuthPortalNavigationController = NavigationControllerHook<
  AuthPortalStep,
  CurrentParams,
  NavigateParams
>;

// Re-export types for backwards compatibility with AuthPortal
export type { NavigationAuthPortalState, NavigateOptions, NavigateParams };
