import { type DataScopes, shortenAddress } from '@sophon-labs/account-core';
import { useEffect, useMemo, useState } from 'react';
import { useSophonAccount, useSophonName } from '../../hooks';
import { useEmbeddedAuth } from '../../hooks/use-embedded-auth';
import { useFlowManager } from '../../hooks/use-flow-manager';
import { useSophonContext } from '../../hooks/use-sophon-context';
import { useTranslation } from '../../i18n';
import type { AuthPortalStep, CurrentParams } from '../types';
import { useNavigationController } from './use-navigation-controller';

const STEPS_ALLOW_BACK_BUTTON: AuthPortalStep[] = ['verifyEmail'];
const STEPS_FORCE_DISPLAY_BACK_BUTTON: AuthPortalStep[] = ['retry'];

const STEPS_WITH_SIGN_IN: AuthPortalStep[] = [
  'signIn',
  'loading',
  'authorization',
  'retry',
  'verifyEmail',
];

interface Props {
  scopes: DataScopes[];
}

export const useAuthPortalController = (props: Props) => {
  const { t } = useTranslation();
  const navigation = useNavigationController();
  const { method } = useFlowManager();
  const { isConnected, account, isConnecting } = useSophonAccount();
  const { connectingAccount } = useSophonContext();
  const { requiresAuthorization } = useSophonContext();
  const { getAvailableDataScopes } = useEmbeddedAuth();
  const [dataScopes, setDataScopes] = useState<DataScopes[]>([]);

  useEffect(() => {
    (async () => {
      const available = await getAvailableDataScopes();
      setDataScopes(
        props.scopes?.filter((scope) => available.includes(scope)) ?? [],
      );
    })();
  }, [getAvailableDataScopes, props.scopes]);

  const shouldAuthorize = isConnected || !!connectingAccount;

  const currentStep = useMemo<AuthPortalStep | null | undefined>(() => {
    switch (method) {
      case 'eth_requestAccounts':
      case 'wallet_requestPermissions': {
        if (requiresAuthorization && shouldAuthorize) return 'authorization';
        return navigation.currentState || 'signIn';
      }
      case 'personal_sign':
      case 'eth_signTypedData_v4':
        return 'signMessage';
      case 'eth_sendTransaction':
        return 'transaction';
      case 'sophon_requestConsent':
        return 'consent';
      default:
        return null;
    }
  }, [method, navigation.currentState, requiresAuthorization, shouldAuthorize]);

  const { isLoading, isConnectingAccount } = useMemo(() => {
    return {
      isLoading: currentStep === 'loading',
      isConnectingAccount:
        (requiresAuthorization && currentStep === 'authorization') ||
        isConnected,
    };
  }, [currentStep, isConnected, requiresAuthorization]);

  const params = useMemo(() => {
    if (!currentStep) return null;

    return (
      navigation.currentParams?.[currentStep as keyof CurrentParams] || null
    );
  }, [currentStep, navigation.currentParams]);

  const showBackButton = useMemo(() => {
    if (!currentStep) return false;

    const shouldDisplayBackButton =
      STEPS_FORCE_DISPLAY_BACK_BUTTON.includes(currentStep);
    const canGoBack =
      STEPS_ALLOW_BACK_BUTTON.includes(currentStep) &&
      Boolean((navigation.history?.length ?? 0) > 0);

    return shouldDisplayBackButton || canGoBack;
  }, [navigation.history?.length, currentStep]);

  const userName = useSophonName();

  const displayName = useMemo(() => {
    if (!currentStep) return '';
    if (userName) return userName;
    if (account?.address?.trim()) return shortenAddress(account.address);

    if (STEPS_WITH_SIGN_IN.includes(currentStep)) {
      return t('common.signIn');
    }

    return '';
  }, [account, userName, currentStep, t]);

  const handleProps = useMemo(
    () => ({
      showBackButton,
      hideCloseButton: isLoading || isConnecting,
      title: displayName ?? t('common.signIn'),
    }),
    [showBackButton, isLoading, displayName, isConnecting, t],
  );

  const isConnectedAndAuthorizationComplete = useMemo(() => {
    return isConnected && !requiresAuthorization && !currentStep;
  }, [isConnected, requiresAuthorization, currentStep]);

  const hideTerms = useMemo(
    () => isLoading || isConnectingAccount || currentStep === 'retry',
    [isLoading, isConnectingAccount, currentStep],
  );

  return {
    isLoading,
    isConnectingAccount,
    currentStep,
    showBackButton,
    handleProps,
    params,
    isConnectedAndAuthorizationComplete,
    dataScopes,
    hideTerms,
    ...navigation,
  };
};

export type AuthPortalControllerHook = ReturnType<
  typeof useAuthPortalController
>;
