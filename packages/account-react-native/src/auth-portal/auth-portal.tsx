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
    removeKeyboardListener();
    console.log('showModal');
    bottomSheetRef.current?.expand();
    addKeyboardListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        execTimeoutActionByPlatform(() => {
          console.log('Keyboard snapping to index 0');
          bottomSheetRef.current?.snapToIndex(0);
        });
      },
    );
  }, [addKeyboardListener, removeKeyboardListener]);

  const hideModal = useCallback(() => {
    console.log('hideModal called');
    removeKeyboardListener();
    Keyboard.dismiss();
    bottomSheetRef.current?.close();
  }, [removeKeyboardListener]);

  const onClose = useCallback(() => {
    console.log('onClose called');
    removeKeyboardListener();
    Keyboard.dismiss();
    disableAnimation.setOn();
    cancelCurrentRequest();
    cleanup();
    // Android needs a small delay to avoid visual glitches
    execTimeoutActionByPlatform(
      () => {
        bottomSheetRef.current?.close();
      },
      { platforms: ['android'] },
    );
  }, [removeKeyboardListener, cleanup, disableAnimation, cancelCurrentRequest]);

  const onCloseAndForceCancel = useCallback(async () => {
    hideModal();
    onClose();
    cleanup();
  }, [hideModal, onClose, cleanup]);

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
    setCurrentRequest(request);
    showModal();
  });

  useUIEventHandler('hideModal', () => {
    console.log('useUIEventHandler hideModal called');
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
      } catch (err) {
        console.error('Authentication failed', err);
        navigate('retry', {
          replace: true,
          params: { ownerAddress, provider: navigationParams?.provider },
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
        onCloseAndForceCancel,
      }}
    >
      <AdaptiveBottomSheet
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
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        enableBlurKeyboardOnGesture={true}
        android_keyboardInputMode="adjustResize"
        handleIndicatorStyle={{ backgroundColor: colors.gray[600] }}
        backgroundStyle={{ backgroundColor: colors.background.primary }}
      >
        <Container margin={24} backgroundColor={colors.background.primary}>
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
