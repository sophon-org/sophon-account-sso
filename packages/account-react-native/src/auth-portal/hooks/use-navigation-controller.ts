import { useCallback, useMemo, useState } from "react";
import { useSophonAccount } from "../../hooks";
import { useFlowManager } from "../../hooks/use-flow-manager";
import { useSophonContext } from "../../hooks/use-sophon-context";
import type {
  AuthPortalStep,
  NavigateOptions,
  NavigateParams,
  NavigationAuthPortalState,
} from "../types";

const initialState: NavigationAuthPortalState = {
  currentState: null,
  history: [],
  currentParams: null,
};

export const useNavigationController = () => {
  const { method } = useFlowManager();
  const { isConnected } = useSophonAccount();
  const { connectingAccount } = useSophonContext();
  const [state, setConfig] = useState<NavigationAuthPortalState | null>(initialState);

  const { history, currentState, currentParams } = state ?? {
    history: [],
    currentState: null,
    currentParams: null,
  };

  const currentStep = useMemo<AuthPortalStep>(() => {
    switch (method) {
      case "eth_requestAccounts":
      case "wallet_requestPermissions": {
        if (isConnected || connectingAccount) return "authorization";
        return currentState || "signIn";
      }
      case "personal_sign":
      case "eth_signTypedData_v4":
        return "signMessage";
      case "eth_sendTransaction":
        return "transaction";
      case "sophon_requestConsent":
        return "consent";
      // case 'wallet_revokePermissions':
      // case 'wallet_disconnect':
      default:
        return null;
    }
  }, [method, currentState, isConnected, connectingAccount]);

  const navigate = useCallback(
    (step: AuthPortalStep, options?: NavigateOptions) =>
      setConfig((prev) => {
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

        const stepExists = prev?.history.some((existingStep) => existingStep === step);

        if (stepExists) return prev;

        const addInheritParams = options?.inheritParamsFrom?.reduce((acc, inheritStep) => {
          acc[inheritStep] =
            options?.params ||
            prev?.currentParams?.[inheritStep as keyof typeof prev.currentParams] ||
            null;
          return acc;
        }, {});

        const _currentParams = {
          ...(prev?.currentParams ?? {}),
          [step]: options?.params || null,
          ...addInheritParams,
        };
        const _history = [...(prev?.history || []), prev?.currentState || currentStep].filter(
          Boolean,
        ) as AuthPortalStep[];
        console.log("currentParams", _currentParams, _history);
        return {
          currentState: step,
          history: _history,
          currentParams: _currentParams,
        };
      }),
    [currentStep],
  );

  const cleanup = useCallback(() => {
    setConfig(initialState);
  }, []);

  const goBack = useCallback((options?: NavigateOptions) => {
    setConfig((prev) => {
      if (prev.currentState === "retry") return initialState;
      if (!prev || prev.history.length === 0) return prev;
      const newHistory = prev.history.slice(0, -1);
      const newCurrentState = prev.history[prev.history.length - 1];
      if (newCurrentState === "signIn") return initialState;
      if (!newCurrentState) return prev;
      return {
        currentState: newCurrentState,
        history: newHistory,
        currentParams: {
          ...prev.currentParams,
          [newCurrentState]: Object.assign(
            {},
            prev.currentParams?.[newCurrentState as keyof typeof prev.currentParams] ?? {},
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
                  ...(prev.currentParams?.[prev.currentState as keyof typeof prev.currentParams] ??
                    {}),
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

  const { isLoading, isConnectingAccount } = useMemo(() => {
    return {
      isLoading: currentStep === "loading",
      isConnectingAccount: currentStep === "authorization" || isConnected,
    };
  }, [currentStep, isConnected]);

  const params = useMemo(() => {
    return currentParams?.[currentStep || ""] || null;
  }, [currentStep, currentParams]);

  const showBackButton = useMemo(() => {
    if (currentStep === "retry") return true;

    const STEPS_WITHOUT_BACK_BUTTON: AuthPortalStep[] = [
      "signMessage",
      "transaction",
      "consent",
      "loading",
      "authorization",
    ];

    const hasHistory = history.length > 0;
    const canNavigateBack = !STEPS_WITHOUT_BACK_BUTTON.includes(currentStep);

    return hasHistory && canNavigateBack;
  }, [history.length, currentStep]);

  const handleNavTitle = useMemo(() => {
    const STEPS_WITH_SIGN_IN: AuthPortalStep[] = [
      "signIn",
      "loading",
      "authorization",
      "retry",
      "verifyEmail",
    ];

    if (STEPS_WITH_SIGN_IN.includes(currentStep)) {
      return "Sign in";
    }

    switch (currentStep) {
      case "consent":
        return "Data Permissions";
    }

    if (isConnectingAccount) return "coolkid123.soph.id";

    return "Sign in";
  }, [isConnectingAccount, currentStep]);

  const handleProps = useMemo(
    () => ({
      showBackButton,
      hideCloseButton: isLoading,
      title: handleNavTitle,
    }),
    [history, isLoading, handleNavTitle],
  );

  return {
    isLoading,
    isConnectingAccount,
    currentStep,
    history,
    currentState,
    currentParams,
    showBackButton,
    handleProps,
    params,
    navigate,
    goBack,
    cleanup,
    setParams,
    initializeConfig,
  };
};

export type NavigationBottomSheetHook = ReturnType<typeof useNavigationController>;
