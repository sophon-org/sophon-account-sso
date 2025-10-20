import { useCallback, useMemo, useState } from 'react';
import { useSophonAccount } from '../../hooks';
import { useFlowManager } from '../../hooks/use-flow-manager';
import { useSophonContext } from '../../hooks/use-sophon-context';
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

export const useNavigationController = () => {
  const { method } = useFlowManager();
  const { isConnected } = useSophonAccount();
  const { connectingAccount } = useSophonContext();
  const [state, setConfig] = useState<NavigationAuthPortalState | null>(
    initialState,
  );

  const { history, currentState, currentParams } = state ?? {
    history: [],
    currentState: null,
    currentParams: null,
  };
  const currentStep = useMemo<AuthPortalStep | null | undefined>(() => {
    switch (method) {
      case 'eth_requestAccounts':
      case 'wallet_requestPermissions': {
        if (isConnected || connectingAccount) return 'authorization';
        return currentState || 'signIn';
      }
      case 'personal_sign':
      case 'eth_signTypedData_v4':
        return 'signMessage';
      case 'eth_sendTransaction':
        return 'transaction';
      case 'sophon_requestConsent':
        return 'consent';
      // case 'wallet_revokePermissions':
      // case 'wallet_disconnect':
      default:
        return null;
    }
  }, [method, currentState, isConnected, connectingAccount]);

  const navigate = useCallback(
    (step: AuthPortalStep, options?: NavigateOptions) =>
      // biome-ignore lint/suspicious/noExplicitAny: reevaluate the any, @cleo
      setConfig((prev: any) => {
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
          // biome-ignore lint/suspicious/noExplicitAny: reevaluate the any, @cleo
          (existingStep: any) => existingStep === step,
        );
        const addInheritParams = options?.inheritParamsFrom?.reduce(
          // biome-ignore lint/suspicious/noExplicitAny: reevaluate the any, @cleo
          (acc: any, inheritStep) => {
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
              history: [
                ...(prev?.history || []),
                prev?.currentState || currentStep,
              ].filter(Boolean) as AuthPortalStep[],
              currentParams: {
                ...prev?.currentParams,
                [step]: options?.params || null,
                ...addInheritParams,
              },
            };
      }),
    [currentStep],
  );

  const goBack = useCallback((options?: NavigateOptions) => {
    setConfig((prev) => {
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

  const cleanup = useCallback(() => {
    setConfig(initialState);
  }, []);

  const initializeConfig = useCallback(() => {
    setConfig(initialState);
  }, []);

  const { isLoading, isConnectingAccount } = useMemo(() => {
    return {
      isLoading: currentStep === 'loading',
      isConnectingAccount: currentStep === 'authorization' || isConnected,
    };
  }, [currentStep, isConnected]);

  const params = useMemo(() => {
    if (!currentStep || currentParams) return null;
    return currentParams?.[currentStep] || null;
  }, [currentStep, currentParams]);

  const showBackButton = useMemo(
    () =>
      Boolean((history.length ?? 0) > 0) &&
      ![
        'signMessage',
        'transaction',
        'consent',
        'loading',
        'authorization',
      ].includes(currentStep ?? ''),
    [history, currentStep],
  );

  const handleProps = useMemo(
    () => ({
      showBackButton,
      hideCloseButton: isLoading,
      title: isConnectingAccount ? 'coolkid123.soph.id' : 'Sign in',
    }),
    [history, isLoading, isConnectingAccount],
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

export type NavigationBottomSheetHook = ReturnType<
  typeof useNavigationController
>;
