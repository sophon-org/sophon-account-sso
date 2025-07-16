import { useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useAccountContext } from "./useAccountContext";
import { useAuthResponse } from "./useAuthResponse";
import { useMessageHandler } from "./useMessageHandler";
import { deployAccount, getsSmartAccounts } from "@/service/account.service";
import { AuthState, AuthContext } from "@/types/auth";

interface UseDynamicAuthParams {
  state: AuthState;
  setState: (state: AuthState) => void;
  setContext: React.Dispatch<React.SetStateAction<AuthContext>>;
  goToNotAuthenticated: () => void;
}

export function useDynamicAuth({
  state,
  setState,
  setContext,
  goToNotAuthenticated,
}: UseDynamicAuthParams) {
  const { sdkHasLoaded, user, primaryWallet } = useDynamicContext();
  const { login, logout, dynamicWallet } = useAccountContext();
  const { handleAuthSuccessResponse } = useAuthResponse();
  const { incomingRequest, sessionPreferences } = useMessageHandler();

  const handleAuthentication = async () => {
    try {
      const { accounts } = await getsSmartAccounts(
        primaryWallet!.address as `0x${string}`
      );

      let smartAccountAddress: `0x${string}`;
      if (accounts.length === 0) {
        const response = await deployAccount(
          primaryWallet!.address as `0x${string}`
        );
        smartAccountAddress = response.accounts[0] as `0x${string}`;
      } else {
        smartAccountAddress = accounts[0] as `0x${string}`;
      }

      await login({
        address: smartAccountAddress,
        username: user!.username!,
        owner: {
          address: primaryWallet!.address as `0x${string}`,
          passkey: null,
          privateKey: null,
        },
      });

      setState(AuthState.AUTHENTICATED);

      if (incomingRequest) {
        handleAuthSuccessResponse(
          { address: smartAccountAddress },
          incomingRequest,
          sessionPreferences
        );
      }
    } catch (error) {
      console.error("❌ Authentication failed:", error);
      setState(AuthState.ERROR);
      setContext((prev) => ({ ...prev, error: "Authentication failed" }));
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setState(AuthState.NOT_AUTHENTICATED);
  };

  // SDK sync useEffect
  useEffect(() => {
    if (sdkHasLoaded && state === AuthState.LOADING) {
      // Check if user is already authenticated in Dynamic SDK
      if (user && primaryWallet) {
        console.log(
          "🔥 SDK loaded, user already authenticated, transitioning to AUTHENTICATED"
        );
        handleAuthentication();
      } else {
        console.log(
          "🔥 SDK loaded, no user found, transitioning to NOT_AUTHENTICATED"
        );
        goToNotAuthenticated();
      }
    }
  }, [sdkHasLoaded, state, user, primaryWallet]);

  // Watch for authentication changes after initial load
  useEffect(() => {
    if (
      sdkHasLoaded &&
      (state === AuthState.NOT_AUTHENTICATED ||
        state === AuthState.WAITING_PRIMARY_WALLET)
    ) {
      // User authenticated after being in NOT_AUTHENTICATED state
      if (user && primaryWallet) {
        console.log(
          "🔥 User authenticated via Dynamic SDK, transitioning to AUTHENTICATED"
        );
        handleAuthentication();
      }
    }
  }, [sdkHasLoaded, state, user, primaryWallet]);

  // Watch for Dynamic logout
  useEffect(() => {
    // Only trigger logout detection if this was a Dynamic authentication flow
    // (indicated by the presence of dynamicWallet)
    if (
      sdkHasLoaded &&
      !user &&
      state === AuthState.AUTHENTICATED &&
      dynamicWallet
    ) {
      handleLogout();
    }
  }, [sdkHasLoaded, user, state, dynamicWallet]);

  return {
    handleAuthentication,
    handleLogout,
  };
}
