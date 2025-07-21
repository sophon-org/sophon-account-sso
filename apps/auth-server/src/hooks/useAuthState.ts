import { useState } from "react";
import { type AuthContext, AuthState } from "@/types/auth";
import { useAuthActions } from "./useAuthActions";
import { useDynamicAuth } from "./useDynamicAuth";

function useAuthState() {
  const [state, setState] = useState<AuthState>(AuthState.LOADING);
  const [context, setContext] = useState<AuthContext>({});
  const authActions = useAuthActions({ setState, setContext, context });
  const { handleAuthentication } = useDynamicAuth({
    state,
    setState,
    setContext,
    goToNotAuthenticated: () => setState(AuthState.NOT_AUTHENTICATED),
  });

  const goToSelectingWallet = () => setState(AuthState.SELECTING_WALLET);
  const goToNotAuthenticated = () => setState(AuthState.NOT_AUTHENTICATED);
  const goToCreatingAccount = () => setState(AuthState.CREATING_ACCOUNT);
  const goToLoggingIn = () => setState(AuthState.LOGGING_IN);
  const goToAuthenticated = async () => {
    await handleAuthentication();
  };
  const goToSuccess = (accountAddress?: string) => {
    setState(AuthState.SUCCESS);
    if (accountAddress) {
      setContext((prev) => ({ ...prev, accountAddress }));
    }
  };
  const goToError = (error: string) => {
    setState(AuthState.ERROR);
    setContext((prev) => ({ ...prev, error }));
  };

  const isLoading = [AuthState.LOADING, AuthState.CREATING_ACCOUNT, AuthState.LOGGING_IN].includes(
    state,
  );

  return {
    state,
    context,
    // State transition functions
    goToSelectingWallet,
    goToNotAuthenticated,
    goToCreatingAccount,
    goToLoggingIn,
    goToAuthenticated,
    goToSuccess,
    goToError,
    // Action functions
    ...authActions,
    // Computed properties
    isLoading,
  };
}

export { AuthState, type AuthContext, useAuthState };
