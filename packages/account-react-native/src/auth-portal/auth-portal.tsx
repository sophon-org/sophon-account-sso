import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetHandleProps,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useMemo, useRef } from "react";
import { Keyboard, Platform, useWindowDimensions } from "react-native";
import { useFlowManager } from "../hooks/use-flow-manager";
import { useUIEventHandler } from "../messaging/ui";
import type { AuthPortalProps, BasicStepProps } from "./types";
import { StepTransitionView } from "./components/step-transition";
import { StepControllerComponent } from "./steps";
import { FooterSheet } from "./components/footer-sheet";
import { AuthPortalContext } from "./context/auth-sheet.context";
import { useSophonAccount } from "../hooks";
import { AuthPortalBottomSheetHandle } from "./components/handle-sheet";
import { useNavigationAuthPortal } from "./hooks/useNavigationAuthPortal";
import { useKeyboard } from "./hooks/useKeyboard";

export function AuthPortal(props: AuthPortalProps) {
  const { isConnected, isConnecting } = useSophonAccount();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const { width } = useWindowDimensions();
  const stepItemWidth = useMemo(() => width - 48, [width]);
  const { currentState, showBackButton, navigate, goBack, cleanup, setParams, currentParams } =
    useNavigationAuthPortal();
  const { currentRequest, setCurrentRequest, cancelCurrentRequest, clearCurrentRequest } =
    useFlowManager();

  const { addKeyboardListener, removeKeyboardListener, keyboardOffSet } = useKeyboard();

  const currentStep = useMemo(() => {
    if (isConnecting) return "loading";
    if (isConnected) return "authorization";
    return currentState;
  }, [currentState, isConnected, isConnecting]);

  const isLoading = useMemo(() => {
    return currentStep === "loading";
  }, [currentStep]);

  const params = useMemo(() => {
    return currentParams?.[currentStep] || null;
  }, [currentStep, currentParams]);

  const showModal = useCallback(() => {
    bottomSheetRef.current?.expand();
    addKeyboardListener("keyboardWillHide", () => {
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
    console.log("close modal", currentRequest?.id);
    if (currentRequest?.id) {
      cancelCurrentRequest();
    }
    removeKeyboardListener();
  }, [currentRequest]);

  const renderHandleComponent = useCallback(
    (props: BottomSheetHandleProps) => {
      return (
        <AuthPortalBottomSheetHandle
          {...props}
          showBackButton={showBackButton && !isLoading}
          goBack={goBack}
          close={hideModal}
          hideCloseButton={isLoading}
        />
      );
    },
    [hideModal, goBack, showBackButton, isLoading],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior={isLoading ? "none" : "close"}
      />
    ),
    [isLoading],
  );

  useUIEventHandler("outgoingRpc", (request) => {
    setCurrentRequest(request);
    showModal();
  });

  // useUIEventHandler('showModal', ({ requestId }) => {
  //   requestIdRef.current = requestId as UUID;
  //   showModal();
  // });
  useUIEventHandler("hideModal", () => {
    hideModal();
  });

  const onComplete = useCallback<BasicStepProps["onComplete"]>(
    async ({ hide }) => {
      console.log("onComplete", hide);
      if (hide) {
        clearCurrentRequest();
        hideModal();
      }
    },
    [hideModal],
  );
  const onCancel = useCallback(async () => {
    // clearCurrentRequest();
    console.log("onCancel");
    hideModal();
  }, [hideModal]);
  const onError = useCallback(async (error: Error) => {
    // clearCurrentRequest();
    console.log("onError", error);
  }, []);

  return (
    <AuthPortalContext.Provider
      value={{
        currentStep,
        navigate,
        goBack,
        setParams,
        stepItemWidth,
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
        // bottomInset={-keyboardOffSet}
        index={-1}
        animateOnMount
        enablePanDownToClose={true}
        enableDynamicSizing={true}
        keyboardBehavior={Platform.OS === "ios" ? "interactive" : "fillParent"}
        keyboardBlurBehavior="restore"
        enableBlurKeyboardOnGesture={true}
        android_keyboardInputMode="adjustResize"
        handleIndicatorStyle={{ backgroundColor: "#ccc" }}
      >
        <BottomSheetView style={{ padding: 24 }}>
          <StepTransitionView keyProp={currentStep} isBackAvailable={!showBackButton}>
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
