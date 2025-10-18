import { useCallback, useState } from "react";
import type { AuthPortalStep, NavigateOptions, NavigationAuthPortalState } from "../types";
import { Keyboard } from "react-native";

const initialState: NavigationAuthPortalState = {
  currentState: "signIn",
  history: [],
  currentParams: null,
};

export function useNavigationAuthPortal() {
  const [state = { history: [], currentState: null, currentParams: null }, setConfig] =
    useState<NavigationAuthPortalState | null>(initialState);

  const navigate = useCallback(
    (step: AuthPortalStep, options?: NavigateOptions) =>
      setConfig((prev) => {
        if (options?.replace)
          return {
            currentState: step,
            history: [],
            currentParams: {
              ...prev.currentParams,
              [step]: options?.params || null,
            },
          };

        const stepExists = prev.history.some((existingStep) => existingStep === step);
        const addInheritParams = options?.inheritParamsFrom?.reduce((acc, inheritStep) => {
          return {
            ...acc,
            [inheritStep]: options?.params || prev.currentParams[inheritStep] || null,
          };
        }, {});
        return stepExists
          ? prev
          : {
              currentState: step,
              history: [...prev.history, prev.currentState],
              currentParams: {
                ...prev.currentParams,
                [step]: options?.params || null,
                ...addInheritParams,
              },
            };
      }),
    [],
  );

  const goBack = useCallback((options?: NavigateOptions) => {
    setConfig((prev) => {
      if (prev.history.length === 0) return prev;
      const newHistory = prev.history.slice(0, -1);
      const newCurrentState = prev.history[prev.history.length - 1];
      return {
        currentState: newCurrentState,
        history: newHistory,
        currentParams: {
          ...prev.currentParams,
          [newCurrentState]: Object.assign(
            {},
            prev.currentParams[newCurrentState] ?? {},
            options?.params ?? {},
          ),
        },
      };
    });
  }, []);

  const setParams = useCallback(
    (params: Record<string, any>) =>
      setConfig((prev) => ({
        ...prev,
        currentParams: {
          ...prev.currentParams,
          [prev.currentState]: {
            ...prev.currentParams[prev.currentState],
            ...params,
          },
        },
      })),
    [],
  );

  const cleanup = useCallback(() => {
    setConfig(initialState);
  }, []);

  const initializeConfig = useCallback(() => {
    setConfig(initialState);
  }, []);

  const showBackButton = state?.history.length > 0;
  return {
    ...state,
    navigate,
    goBack,
    cleanup,
    setParams,
    showBackButton,
    initializeConfig,
  };
}

export type NavigationBottomSheetHook = ReturnType<typeof useNavigationAuthPortal>;
