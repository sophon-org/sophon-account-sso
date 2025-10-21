import { shortenAddress } from '@sophon-labs/account-core';
import { useMemo } from 'react';
import { useSophonAccount, useSophonName } from '../../hooks';
import { useFlowManager } from '../../hooks/use-flow-manager';
import { useSophonContext } from '../../hooks/use-sophon-context';
import type { AuthPortalStep } from '../types';
import { useNavigationController } from './use-navigation-controller';

const STEPS_ALLOW_BACK_BUTTON: AuthPortalStep[] = ['verifyEmail'];

const STEPS_WITH_SIGN_IN: AuthPortalStep[] = [
  'signIn',
  'loading',
  'authorization',
  'retry',
  'verifyEmail',
];

export const useAuthPortalController = () => {
  const navigation = useNavigationController();
  const { method } = useFlowManager();
  const { isConnected, account } = useSophonAccount();
  const { connectingAccount } = useSophonContext();

  const currentStep = useMemo<AuthPortalStep | null | undefined>(() => {
    switch (method) {
      case 'eth_requestAccounts':
      case 'wallet_requestPermissions': {
        if (isConnected || connectingAccount) return 'authorization';
        return navigation.currentState || 'signIn';
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
  }, [method, navigation.currentState, isConnected, connectingAccount]);

  const { isLoading, isConnectingAccount } = useMemo(() => {
    return {
      isLoading: currentStep === 'loading',
      isConnectingAccount: currentStep === 'authorization' || isConnected,
    };
  }, [currentStep, isConnected]);

  const params = useMemo(() => {
    return navigation.currentParams?.[currentStep || ''] || null;
  }, [currentStep, navigation.currentParams]);

  const showBackButton = useMemo(() => {
    if (currentStep === 'retry') return true;

    const hasHistory = Boolean((navigation.history.length ?? 0) > 0);
    const canNavigateBack = STEPS_ALLOW_BACK_BUTTON.includes(currentStep);

    return hasHistory && canNavigateBack;
  }, [navigation.history.length, currentStep]);

  const userName = useSophonName();

  const displayName = useMemo(() => {
    if (userName) return userName;
    if (account?.address?.trim()) return shortenAddress(account.address);

    if (STEPS_WITH_SIGN_IN.includes(currentStep)) {
      return 'Sign in';
    }

    return '';
  }, [account, userName, isConnected]);

  const handleProps = useMemo(
    () => ({
      showBackButton,
      hideCloseButton: isLoading,
      title: displayName ?? 'Sign in',
    }),
    [navigation.history, isLoading, displayName],
  );

  return {
    isLoading,
    isConnectingAccount,
    currentStep,
    showBackButton,
    handleProps,
    params,
    ...navigation,
  };
};

export type AuthPortalControllerHook = ReturnType<
  typeof useAuthPortalController
>;
