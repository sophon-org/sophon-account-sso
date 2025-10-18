import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetHandleProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useRef } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useFlowManager } from '../hooks/use-flow-manager';
import { useUIEventHandler } from '../messaging/ui';
import { FooterSheet } from './components/footer-sheet';
import { AuthPortalBottomSheetHandle } from './components/handle-sheet';
import { StepTransitionView } from './components/step-transition';
import { AuthPortalContext } from './context/auth-sheet.context';
import { useCurrentStep } from './hooks/use-current-step';
import { useKeyboard } from './hooks/use-keyboard';
import { useNavigationAuthPortal } from './hooks/use-navigation';
import { StepControllerComponent } from './steps';
import type { AuthPortalProps, BasicStepProps } from './types';

export function AuthPortal(props: AuthPortalProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const {
    currentRequest,
    setCurrentRequest,
    cancelCurrentRequest,
    clearCurrentRequest,
  } = useFlowManager();

  const { addKeyboardListener, removeKeyboardListener } = useKeyboard();
  const {
    currentState,
    showBackButton,
    navigate,
    goBack,
    cleanup,
    setParams,
    currentParams,
  } = useNavigationAuthPortal();
  const currentStep = useCurrentStep(currentState);

  const isLoading = useMemo(() => {
    return currentStep === 'loading';
  }, [currentStep]);

  const params = useMemo(() => {
    if (!currentStep || currentParams) return null;
    return currentParams?.[currentStep] || null;
  }, [currentStep, currentParams]);

  const showModal = useCallback(() => {
    bottomSheetRef.current?.expand();
    addKeyboardListener('keyboardWillHide', () => {
      bottomSheetRef.current?.snapToIndex(0);
    });
  }, []);

  const hideModal = useCallback(() => {
    cleanup();
    Keyboard.dismiss();
    bottomSheetRef.current?.close();
  }, []);

  const onClose = useCallback(() => {
    Keyboard.dismiss();
    cleanup();
    removeKeyboardListener();
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
    (props: BottomSheetHandleProps) => {
      return (
        <AuthPortalBottomSheetHandle
          {...props}
          showBackButton={showBackButton && !isLoading}
          goBack={goBack}
          close={onCloseAndCancel}
          hideCloseButton={isLoading}
        />
      );
    },
    [onCloseAndCancel, goBack, showBackButton, isLoading],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior={isLoading ? 'none' : 'close'}
      />
    ),
    [isLoading],
  );

  useUIEventHandler('outgoingRpc', (request) => {
    setCurrentRequest(request);
    showModal();
  });

  // useUIEventHandler('showModal', ({ requestId }) => {
  //   requestIdRef.current = requestId as UUID;
  //   showModal();
  // });
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
  const onCancel = useCallback(async () => {
    // clearCurrentRequest();
    console.log('onCancel');
    hideModal();
  }, [hideModal]);
  const onError = useCallback(async (error: Error) => {
    // clearCurrentRequest();
    console.log('onError', error);
  }, []);

  return (
    <AuthPortalContext.Provider
      value={{
        currentStep,
        navigate,
        goBack,
        setParams,
        params,
        ...props,
      }}
    >
      <BottomSheet
        onClose={onClose}
        ref={bottomSheetRef}
        backdropComponent={renderBackdrop}
        handleComponent={renderHandleComponent}
        topInset={props.insets?.top ?? 0}
        index={-1}
        animateOnMount
        enablePanDownToClose={true}
        enableDynamicSizing={true}
        keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'fillParent'}
        keyboardBlurBehavior="restore"
        enableBlurKeyboardOnGesture={true}
        android_keyboardInputMode="adjustResize"
        handleIndicatorStyle={{ backgroundColor: '#ccc' }}
      >
        <BottomSheetView style={{ padding: 24 }}>
          <StepTransitionView
            keyProp={currentStep}
            isBackAvailable={!showBackButton}
          >
            <StepControllerComponent
              step={currentStep}
              onComplete={onComplete}
              onCancel={onCancel}
              onError={onError}
            />
          </StepTransitionView>
          <FooterSheet hideTerms={isLoading} />
        </BottomSheetView>
      </BottomSheet>
    </AuthPortalContext.Provider>
  );
}
