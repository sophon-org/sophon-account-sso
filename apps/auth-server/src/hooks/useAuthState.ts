import { useState, useEffect } from "react";
import { SmartAccount } from "@/types/smart-account";
import { useAccountCreate } from "./useAccountCreate";
import { useWalletConnection } from "./useWalletConnection";
import {
  useConnectWithOtp,
  useSocialAccounts,
  useDynamicContext,
} from "@dynamic-labs/sdk-react-core";
import { ProviderEnum } from "@dynamic-labs/types";
import { SigningRequest, TransactionRequest } from "@/types/auth";
import { useAccountContext } from "./useAccountContext";

enum AuthState {
  LOADING = "loading",
  NOT_AUTHENTICATED = "not_authenticated",
  CREATING_ACCOUNT = "creating_account",
  WAITING_OTP = "waiting_otp",
  WAITING_PRIMARY_WALLET = "waiting_primary_wallet",
  LOGGING_IN = "logging_in",
  AUTHENTICATED = "authenticated",
  SIGNING_REQUEST = "signing_request",
  TRANSACTION_REQUEST = "transaction_request",
  SUCCESS = "success",
  ERROR = "error",
}

interface AuthContext {
  account?: SmartAccount;
  accountAddress?: string;
  accountData?: unknown;
  error?: string;
  email?: string;
  signingRequest?: SigningRequest;
  transactionRequest?: TransactionRequest;
}

function useAuthState() {
  const [state, setState] = useState<AuthState>(AuthState.LOADING);
  const [context, setContext] = useState<AuthContext>({});

  // Add Dynamic context
  const { sdkHasLoaded, user, primaryWallet } = useDynamicContext();

  // Use the real account creation hook
  const { createAccount, success, accountAddress, error } = useAccountCreate();

  // Use wallet connection hook
  const { address, isConnected, connectWallet } = useWalletConnection();

  // Use email authentication hook
  const { connectWithEmail, verifyOneTimePassword } = useConnectWithOtp();

  // Use social authentication hook
  const { signInWithSocialAccount } = useSocialAccounts();

  const { login } = useAccountContext();

  // Simple helper functions to change state
  const goToNotAuthenticated = () => setState(AuthState.NOT_AUTHENTICATED);
  const goToCreatingAccount = () => setState(AuthState.CREATING_ACCOUNT);
  const goToLoggingIn = () => setState(AuthState.LOGGING_IN);
  const goToAuthenticated = () => {
    console.log("🔥 User authenticated, transitioning to AUTHENTICATED");
    login({
      address: primaryWallet!.address as `0x${string}`,
      username: user!.username!,
      owner: {
        address: primaryWallet!.address as `0x${string}`,
        passkey: null,
        privateKey: null,
      },
    });
    setState(AuthState.AUTHENTICATED);
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

  // SDK sync useEffect - moved from page.tsx
  useEffect(() => {
    if (sdkHasLoaded && state === AuthState.LOADING) {
      // Check if user is already authenticated in Dynamic SDK
      if (user && primaryWallet) {
        console.log(
          "🔥 SDK loaded, user already authenticated, transitioning to AUTHENTICATED"
        );
        goToAuthenticated();
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
        goToAuthenticated();
      }
    }
  }, [sdkHasLoaded, state, user, primaryWallet]);

  // Watch for account creation success
  useEffect(() => {
    if (success && accountAddress && state === AuthState.CREATING_ACCOUNT) {
      console.log("🔥 Account creation completed!");
      setState(AuthState.SUCCESS);
      setContext((prev) => ({ ...prev, accountAddress }));
    }
  }, [success, accountAddress, state]);

  // Watch for account creation errors
  useEffect(() => {
    if (error && state === AuthState.CREATING_ACCOUNT) {
      console.error("❌ Account creation failed:", error);
      setState(AuthState.ERROR);
      setContext((prev) => ({ ...prev, error }));
    }
  }, [error, state]);

  // Clean action functions - these will replace the useEffects
  const startWalletConnection = async () => {
    setState(AuthState.CREATING_ACCOUNT);
    console.log("🔥 Starting wallet connection and account creation...");

    try {
      // Step 1: Connect wallet if not connected
      if (!isConnected) {
        console.log("🔥 Connecting wallet...");
        await connectWallet();
      }

      // Step 2: Create account with connected wallet address
      console.log("🔥 Creating account with wallet address:", address);
      await createAccount("eoa", address);
      // State will be updated by useEffect when success/error changes
    } catch (error) {
      console.error("❌ Wallet connection failed:", error);
      // useEffect will handle the error state
    }
  };

  const startLogin = async () => {
    setState(AuthState.LOGGING_IN);
    // TODO: Call the actual login logic here
    // For now, just simulate
    console.log("🔥 Starting login...");
  };

  const startEmailAuthentication = async (email: string) => {
    setState(AuthState.CREATING_ACCOUNT);
    console.log("🔥 Starting email authentication...", email);

    try {
      // Send email with OTP
      await connectWithEmail(email);
      console.log("🔥 Email sent successfully");
      setState(AuthState.WAITING_OTP);
      setContext((prev) => ({ ...prev, email }));
    } catch (error) {
      console.error("❌ Email authentication failed:", error);
      setState(AuthState.ERROR);
      setContext((prev) => ({ ...prev, error: "Email authentication failed" }));
    }
  };

  const verifyOTP = async (otp: string) => {
    setState(AuthState.CREATING_ACCOUNT);
    console.log("🔥 Verifying OTP...", otp);

    try {
      await verifyOneTimePassword(otp);
      console.log(
        "🔥 OTP verified successfully - user should be authenticated now"
      );
      // goToAuthenticated();
      setState(AuthState.WAITING_PRIMARY_WALLET);
    } catch (error) {
      console.error("❌ OTP verification failed:", error);
      setState(AuthState.ERROR);
      setContext((prev) => ({ ...prev, error: "OTP verification failed" }));
    }
  };

  const startSocialAuthentication = async (provider: ProviderEnum) => {
    try {
      setState(AuthState.CREATING_ACCOUNT);
      setContext({ ...context });

      // Use Dynamic's social authentication
      await signInWithSocialAccount(provider);

      // Social authentication automatically handles login/create
      setState(AuthState.AUTHENTICATED);
    } catch (error) {
      console.error("❌ Social authentication failed:", error);
      setState(AuthState.ERROR);
      setContext({ ...context, error: "Social authentication failed" });
    }
  };

  // BABY STEP: Add simple actions for signing and transaction requests
  const startSigningRequest = (signingRequest: SigningRequest) => {
    setState(AuthState.SIGNING_REQUEST);
    setContext({ ...context, signingRequest });
  };

  const startTransactionRequest = (transactionRequest: TransactionRequest) => {
    setState(AuthState.TRANSACTION_REQUEST);
    setContext({ ...context, transactionRequest });
  };

  // Computed properties for easier usage
  const isLoading = [
    AuthState.LOADING,
    AuthState.CREATING_ACCOUNT,
    AuthState.LOGGING_IN,
  ].includes(state);

  return {
    state,
    context,
    // State transition functions
    goToNotAuthenticated,
    goToCreatingAccount,
    goToLoggingIn,
    goToAuthenticated,
    goToSuccess,
    goToError,
    // Action functions - these do the actual work
    startWalletConnection,
    startLogin,
    startEmailAuthentication,
    verifyOTP,
    startSocialAuthentication,
    // Actions for signing/transaction requests
    startSigningRequest,
    startTransactionRequest,
    // Computed properties
    isLoading,
  };
}

export { AuthState, type AuthContext, useAuthState };
