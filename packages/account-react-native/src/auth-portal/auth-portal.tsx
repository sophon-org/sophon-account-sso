import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetHandle,
  type BottomSheetHandleProps,
} from '@gorhom/bottom-sheet';
import type { DataScopes } from '@sophon-labs/account-core';
import { useCallback, useEffect, useRef } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useBooleanState, useFlowManager } from '../hooks';
import { useSophonPartner } from '../hooks/use-sophon-partner';
import { useUIEventHandler } from '../messaging/ui';
import { Container, useThemeColors } from '../ui';
import { execTimeoutActionByPlatform } from '../utils/platform-utils';
import { AdaptiveBottomSheet } from './adaptive-bottom-sheet';
import { AuthPortalBottomSheetHandle } from './components/custom-sheet-handle';
import { FooterSheet } from './components/footer-sheet';
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
  const colors = useThemeColors();
  const isClosedModalRef = useRef(false);
  const isOpeningModalRef = useRef(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const disableAnimation = useBooleanState(true);
  const { addKeyboardListener, removeKeyboardListener } = useKeyboard();

  const {
    setCurrentRequest,
    cancelCurrentRequest,
    clearCurrentRequest,
    actions,
  } = useFlowManager();

  const { partner } = useSophonPartner();

  const {
    currentStep,
    showBackButton,
    params,
    handleProps,
    hideTerms,
    navigate,
    goBack,
    cleanup,
    setParams,
    dataScopes,
    isConnectedAndAuthorizationComplete,
  } = useAuthPortalController({ scopes: props.scopes });

  const showModal = useCallback(() => {
    if (isOpeningModalRef.current) {
      console.log('showModal: already opening, skipping');
      return;
    }

    isOpeningModalRef.current = true;
    isClosedModalRef.current = false;
    removeKeyboardListener();
    bottomSheetRef.current?.expand();

    // Reset opening flag after expansion animation
    execTimeoutActionByPlatform(
      () => {
        isOpeningModalRef.current = false;
      },
      {
        iosTimeout: 200,
        androidTimeout: 200,
      },
    );

    addKeyboardListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        execTimeoutActionByPlatform(
          () => {
            console.log('Keyboard snapping to index 0');
            bottomSheetRef.current?.snapToIndex(0);
          },
          {
            iosTimeout: 50,
          },
        );
      },
    );
  }, [addKeyboardListener, removeKeyboardListener]);

  const requestClose = useCallback(
    (forceClose?: boolean) => {
      if (isClosedModalRef.current && !forceClose) {
        return;
      }
      removeKeyboardListener();

      Keyboard.dismiss();

      if (forceClose) bottomSheetRef.current?.close();
      isClosedModalRef.current = true;
      cancelCurrentRequest();
      cleanup();
    },
    [removeKeyboardListener, cleanup, cancelCurrentRequest],
  );

  const hideModal = useCallback(() => {
    if (isClosedModalRef.current) {
      return;
    }

    removeKeyboardListener();
    if (Platform.OS === 'ios') {
      Keyboard.dismiss();
    }
    bottomSheetRef.current?.close();
    requestClose();
  }, [requestClose, removeKeyboardListener]);

  const onBottomSheetClose = useCallback(() => {
    if (isClosedModalRef.current) {
      return;
    }
    removeKeyboardListener();
    requestClose();
  }, [requestClose, removeKeyboardListener]);

  const onCloseAndForceCancel = useCallback(async () => {
    isClosedModalRef.current = false;
    if (Platform.OS === 'android' && Keyboard.isVisible()) {
      removeKeyboardListener();
      addKeyboardListener('keyboardDidHide', () => {
        setTimeout(() => {
          hideModal();
          cancelCurrentRequest();
        }, 50);
      });
      Keyboard.dismiss();
    } else {
      hideModal();
      cancelCurrentRequest();
    }
  }, [
    hideModal,
    cancelCurrentRequest,
    removeKeyboardListener,
    addKeyboardListener,
  ]);

  const renderHandleComponent = useCallback(
    (renderProps: BottomSheetHandleProps) => {
      return (
        <BottomSheetHandle {...renderProps}>
          <AuthPortalBottomSheetHandle
            {...handleProps}
            goBack={goBack}
            close={onCloseAndForceCancel}
          />
        </BottomSheetHandle>
      );
    },
    [onCloseAndForceCancel, goBack, handleProps],
  );

  const renderBackdrop = useCallback(
    (renderProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...renderProps}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        onPress={onCloseAndForceCancel}
        pressBehavior={handleProps?.hideCloseButton ? 'none' : 'close'}
      />
    ),
    [handleProps?.hideCloseButton, onCloseAndForceCancel],
  );

  useUIEventHandler('outgoingRpc', (request) => {
    isClosedModalRef.current = false;
    isOpeningModalRef.current = false;
    setCurrentRequest(request);
    showModal();
  });

  useUIEventHandler('hideModal', () => {
    console.log('useUIEventHandler hideModal called');
    onCloseAndForceCancel();
  });

  const onComplete = useCallback<BasicStepProps['onComplete']>(
    async ({ hide }) => {
      if (hide) {
        clearCurrentRequest();
        hideModal();
      }
    },
    [hideModal, clearCurrentRequest],
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
      } catch (error) {
        console.error('Authentication failed', error);
        navigate('retry', {
          replace: true,
          params: {
            ownerAddress,
            provider: navigationParams?.provider,
            error: error as Error,
          },
        });
      }
    },
    [actions, navigate],
  );

  const onBackToSignIn = useCallback(async () => {
    goBack();
  }, [goBack]);

  const onError = useCallback(async (error: Error, step?: AuthPortalStep) => {
    // clearCurrentRequest();
    // TODO
    console.log(`onError ${step ?? '-'}`, error);
  }, []);

  useEffect(() => {
    // if the user connected and we are not expecting the authorization modal to show up
    // we can hide the modal
    if (isConnectedAndAuthorizationComplete) {
      onComplete({ hide: true });
    }
  }, [onComplete, isConnectedAndAuthorizationComplete]);

  return (
    <AuthPortalContext.Provider
      value={{
        currentStep: currentStep ?? null,
        params,
        navigate,
        goBack,
        setParams,
        handleProps,
        requestClose,
        hideModal,
      }}
    >
      <AdaptiveBottomSheet
        ref={bottomSheetRef}
        onClose={onBottomSheetClose}
        backdropComponent={renderBackdrop}
        handleComponent={renderHandleComponent}
        topInset={props.insets?.top ?? 0}
        index={-1}
        onChange={(index) => {
          disableAnimation.setState(index < 0);
        }}
        animateOnMount={Platform.OS === 'ios'}
        enablePanDownToClose={
          !handleProps?.hideCloseButton || currentStep !== 'verifyEmail'
        }
        enableDynamicSizing={true}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        enableBlurKeyboardOnGesture={true}
        android_keyboardInputMode="adjustPan"
        handleIndicatorStyle={{ backgroundColor: colors.gray[600] }}
        backgroundStyle={{ backgroundColor: colors.background.primary }}
      >
        <Container
          marginVertical={24}
          backgroundColor={colors.background.primary}
        >
          <StepTransitionView
            keyProp={currentStep}
            isBackAvailable={showBackButton}
            disableAnimation={disableAnimation.state}
          >
            <StepControllerComponent
              key={currentStep}
              currentStep={currentStep ?? null}
              onComplete={onComplete}
              onCancel={onCloseAndForceCancel}
              onError={onError}
              onAuthenticate={onAuthenticate}
              onBackToSignIn={onBackToSignIn}
              scopes={dataScopes}
              partner={partner}
            />
          </StepTransitionView>
          <FooterSheet hideTerms={hideTerms} />
        </Container>
      </AdaptiveBottomSheet>
    </AuthPortalContext.Provider>
  );
}
