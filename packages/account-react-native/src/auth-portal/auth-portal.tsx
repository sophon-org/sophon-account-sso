import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetHandleProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { DataScopes } from '@sophon-labs/account-core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useEmbeddedAuth } from '../auth/useAuth';
import { useBooleanState, useFlowManager } from '../hooks';
import { useSophonPartner } from '../hooks/use-sophon-partner';
import { useUIEventHandler } from '../messaging/ui';
import { FooterSheet } from './components/footer-sheet';
import { AuthPortalBottomSheetHandle } from './components/handle-sheet';
import { StepTransitionView } from './components/step-transition';
import { AuthPortalContext } from './context/auth-sheet.context';
import { useKeyboard } from './hooks/use-keyboard';
import { useNavigationController } from './hooks/use-navigation-controller';
import { StepControllerComponent } from './steps';
import type { BasicStepProps } from './types';

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

  const {
    currentRequest,
    setCurrentRequest,
    cancelCurrentRequest,
    clearCurrentRequest,
    actions,
  } = useFlowManager();

  const { addKeyboardListener, removeKeyboardListener } = useKeyboard();
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
  } = useNavigationController();

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
    async (ownerAddress) => {
      navigate('loading', { replace: true });
      console.log('ui ownerAddress', ownerAddress);
      await actions.authenticate(ownerAddress);
      console.log('authenticated');
    },
    [actions],
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

  const { partner } = useSophonPartner();

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
            keyProp={currentStep ?? null}
            isBackAvailable={!showBackButton}
            disableAnimation={disableAnimation.state}
          >
            <StepControllerComponent
              currentStep={currentStep ?? null}
              onComplete={onComplete}
              onCancel={onCancel}
              onError={onError}
              onAuthenticate={onAuthenticate}
              scopes={dataScopes}
              partner={partner}
            />
          </StepTransitionView>
          <FooterSheet hideTerms={isLoading || isConnectingAccount} />
        </BottomSheetView>
      </BottomSheet>
    </AuthPortalContext.Provider>
  );
}
