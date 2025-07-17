import { useAccountCreate } from "./useAccountCreate";
import { useWalletConnection } from "./useWalletConnection";
import {
  useConnectWithOtp,
  useSocialAccounts,
} from "@dynamic-labs/sdk-react-core";
import { ProviderEnum } from "@dynamic-labs/types";
import {
  AuthState,
  AuthContext,
  SigningRequest,
  TransactionRequest,
} from "@/types/auth";

interface UseAuthActionsParams {
  setState: (state: AuthState) => void;
  setContext: React.Dispatch<React.SetStateAction<AuthContext>>;
  context: AuthContext;
}

export function useAuthActions({
  setState,
  setContext,
  context,
}: UseAuthActionsParams) {
  const { createAccount } = useAccountCreate();
  const { address, isConnected, connectWallet } = useWalletConnection();
  const { connectWithEmail, verifyOneTimePassword } = useConnectWithOtp();
  const { signInWithSocialAccount } = useSocialAccounts();

  const startWalletConnection = async () => {
    setState(AuthState.CREATING_ACCOUNT);
    console.log("🔥 Starting wallet connection and account creation...");

    try {
      if (!isConnected) {
        console.log("🔥 Connecting wallet...");
        await connectWallet();
      }
      console.log("🔥 Creating account with wallet address:", address);
      await createAccount("eoa", address);
      setState(AuthState.AUTHENTICATED);
    } catch (error) {
      console.error("❌ Wallet connection failed:", error);
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

    try {
      await verifyOneTimePassword(otp);
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

      await signInWithSocialAccount(provider);

      setState(AuthState.AUTHENTICATED);
    } catch (error) {
      console.error("❌ Social authentication failed:", error);
      setState(AuthState.ERROR);
      setContext({ ...context, error: "Social authentication failed" });
    }
  };

  const startSigningRequest = (signingRequest: SigningRequest) => {
    setState(AuthState.SIGNING_REQUEST);
    setContext({ ...context, signingRequest });
  };

  const startTransactionRequest = (transactionRequest: TransactionRequest) => {
    setState(AuthState.TRANSACTION_REQUEST);
    setContext({ ...context, transactionRequest });
  };

  return {
    startWalletConnection,
    startLogin,
    startEmailAuthentication,
    verifyOTP,
    startSocialAuthentication,
    startSigningRequest,
    startTransactionRequest,
  };
}
