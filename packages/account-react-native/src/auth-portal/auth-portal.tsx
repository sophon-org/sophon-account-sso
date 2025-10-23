import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetHandleProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import type { DataScopes } from '@sophon-labs/account-core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useEmbeddedAuth } from '../auth/useAuth';
import {
  useBooleanState,
  useFlowManager,
  useSophonAccount,
  useSophonContext,
} from '../hooks';
import { useSophonPartner } from '../hooks/use-sophon-partner';
import { useUIEventHandler } from '../messaging/ui';
import { Container } from '../ui';
import { FooterSheet } from './components/footer-sheet';
import { AuthPortalBottomSheetHandle } from './components/handle-sheet';
import { StepTransitionView } from './components/step-transition';
import { AuthPortalContext } from './context/auth-sheet.context';
import { useAuthPortalController } from './hooks';
import { useKeyboard } from './hooks/use-keyboard';
import { StepControllerComponent } from './steps';
import type { AuthPortalStep, BasicStepProps } from './types';

export type AuthPortalProps = {
  debugEnabled?: boolean;
  insets?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  authServerUrl?: string;
  partnerId: string;
  scopes: DataScopes[];
};

export function AuthPortal(props: AuthPortalProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const disableAnimation = useBooleanState(true);
  const { addKeyboardListener, removeKeyboardListener } = useKeyboard();

  const {
    currentRequest,
    setCurrentRequest,
    cancelCurrentRequest,
    clearCurrentRequest,
    actions,
  } = useFlowManager();
  const { getAvailableDataScopes } = useEmbeddedAuth();
  const { partner } = useSophonPartner();

  const [dataScopes, setDataScopes] = useState<DataScopes[]>([]);
  const {
    currentStep,
    showBackButton,
    isLoading,
    params,
    handleProps,
    isConnectingAccount,
    navigate,
    goBack,
    cleanup,
    setParams,
  } = useAuthPortalController();

  useEffect(() => {
    (async () => {
      const available = await getAvailableDataScopes();
      setDataScopes(
        props.scopes?.filter((scope) => available.includes(scope)) ?? [],
      );
    })();
  }, [getAvailableDataScopes, props.scopes]);

  const hideTerms = useMemo(
    () => isLoading || isConnectingAccount || currentStep === 'retry',
    [isLoading, isConnectingAccount, currentStep],
  );

  const showModal = useCallback(() => {
    bottomSheetRef.current?.expand();
    removeKeyboardListener();
    addKeyboardListener('keyboardWillHide', () => {
      console.log('keyboard will hide - snap to index 0');
      bottomSheetRef.current?.snapToIndex(0);
    });
  }, []);

  const hideModal = useCallback(() => {
    removeKeyboardListener();
    cleanup();
    Keyboard.dismiss();
    bottomSheetRef.current?.close();
  }, []);

  const onClose = useCallback(() => {
    removeKeyboardListener();
    Keyboard.dismiss();
    cleanup();
    disableAnimation.setOff();
  }, []);

  const onCloseAndCancel = useCallback(() => {
    hideModal();
    onClose();
    console.log('close modal', currentRequest?.id);
    if (currentRequest?.id) {
      cancelCurrentRequest();
    }
  }, [currentRequest]);

  const renderHandleComponent = useCallback(
    (renderProps: BottomSheetHandleProps) => {
      return (
        <AuthPortalBottomSheetHandle
          {...renderProps}
          {...handleProps}
          goBack={goBack}
          close={onCloseAndCancel}
        />
      );
    },
    [onCloseAndCancel, goBack, handleProps],
  );

  const renderBackdrop = useCallback(
    (renderProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...renderProps}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        onPress={onCloseAndCancel}
        pressBehavior={isLoading ? 'none' : 'close'}
      />
    ),
    [isLoading, onCloseAndCancel, bottomSheetRef],
  );

  useUIEventHandler('outgoingRpc', (request) => {
    setCurrentRequest(request);
    showModal();
  });

  useUIEventHandler('hideModal', () => {
    hideModal();
  });

  const onComplete = useCallback<BasicStepProps['onComplete']>(
    async ({ hide }) => {
      console.log('onComplete', hide);
      if (hide) {
        clearCurrentRequest();
        hideModal();
      }
    },
    [hideModal],
  );

  const onAuthenticate = useCallback<BasicStepProps['onAuthenticate']>(
    async (ownerAddress, navigationParams) => {
      try {
        if (!navigationParams || navigationParams?.from === 'retry') {
          navigate('loading', {
            replace: true,
            params: { provider: navigationParams?.provider },
          });
        }
        await actions.authenticate(ownerAddress);
      } catch (err) {
        console.error('Authentication failed', err);
        navigate('retry', {
          replace: true,
          params: { ownerAddress, provider: navigationParams?.provider },
        });
      }
    },
    [actions],
  );

  const onCancel = useCallback(async () => {
    // clearCurrentRequest();
    console.log('onCancel');
    hideModal();
    clearCurrentRequest();
  }, [hideModal, clearCurrentRequest]);

  const onBackToSignIn = useCallback(async () => {
    console.log('onBackToSignIn');
    cleanup();
  }, [cleanup]);

  const onError = useCallback(async (error: Error, step?: AuthPortalStep) => {
    // clearCurrentRequest();
    console.log(`onError ${step ?? '-'}`, error);
  }, []);

  useEffect(() => {
    (async () => {
      const available = await getAvailableDataScopes();
      setDataScopes(
        props.scopes?.filter((scope) => available.includes(scope)) ?? [],
      );
    })();
  }, [getAvailableDataScopes, props.scopes]);

  // const { partner } = useSophonPartner();

  const { isConnected } = useSophonAccount();
  const { requiresAuthorization } = useSophonContext();
  useEffect(() => {
    // if the user connected and we are not expecting the authorization modal to show up
    // we can hide the modal
    if (isConnected && !requiresAuthorization && !currentStep) {
      onComplete({ hide: true });
    }
  }, [onComplete, requiresAuthorization, isConnected, currentStep]);

  // useEffect(() => {
  //   // if the user connected and we are not expecting the authorization modal to show up
  //   // we can hide the modal
  //   if (isConnectedAndAuthorizationComplete) {
  //     onComplete({ hide: true });
  //   }
  // }, [isConnectedAndAuthorizationComplete]);

  return (
    <AuthPortalContext.Provider
      value={{
        currentStep: currentStep ?? null,
        params,
        navigate,
        goBack,
        setParams,
      }}
    >
      <BottomSheet
        onClose={onClose}
        ref={bottomSheetRef}
        backdropComponent={renderBackdrop}
        handleComponent={renderHandleComponent}
        topInset={props.insets?.top ?? 0}
        index={-1}
        onChange={(currentIndex) => {
          disableAnimation.setState(currentIndex < 0);
        }}
        animateOnMount
        enablePanDownToClose={!handleProps?.hideCloseButton}
        enableDynamicSizing={true}
        keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'fillParent'}
        keyboardBlurBehavior="restore"
        enableBlurKeyboardOnGesture={true}
        android_keyboardInputMode="adjustResize"
        handleIndicatorStyle={{ backgroundColor: '#ccc' }}
      >
        <BottomSheetScrollView bounces={false}>
          <Container margin={24}>
            <StepTransitionView
              keyProp={currentStep ?? null}
              isBackAvailable={showBackButton}
              disableAnimation={disableAnimation.state}
            >
              <StepControllerComponent
                key={currentStep}
                currentStep={currentStep ?? null}
                onComplete={onComplete}
                onCancel={onCancel}
                onError={onError}
                onAuthenticate={onAuthenticate}
                onBackToSignIn={onBackToSignIn}
                scopes={dataScopes}
                partner={partner}
              />
            </StepTransitionView>
            <FooterSheet hideTerms={hideTerms} />
          </Container>
        </BottomSheetScrollView>
      </BottomSheet>
    </AuthPortalContext.Provider>
  );
}
