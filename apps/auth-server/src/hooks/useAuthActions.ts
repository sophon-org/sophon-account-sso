import {
  useConnectWithOtp,
  useSocialAccounts,
} from '@dynamic-labs/sdk-react-core';
import type { ProviderEnum } from '@dynamic-labs/types';
import {
  type AuthContext,
  AuthState,
  type SigningRequest,
  type TransactionRequest,
} from '@/types/auth';
import { useWalletConnection } from './useWalletConnection';

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
  const { connectWallet } = useWalletConnection(setState);
  const { connectWithEmail, verifyOneTimePassword } = useConnectWithOtp();
  const { signInWithSocialAccount } = useSocialAccounts();

  const startWalletConnection = async (connectorName: string) => {
    setState(AuthState.CREATING_ACCOUNT);
    try {
      await connectWallet(connectorName);
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
    }
  };

  const startEmailAuthentication = async (email: string) => {
    setState(AuthState.CREATING_ACCOUNT);

    try {
      // Send email with OTP
      await connectWithEmail(email);
      console.log('🔥 Email sent successfully');
      setState(AuthState.WAITING_OTP);
      setContext((prev) => ({ ...prev, email }));
    } catch (error) {
      console.error('❌ Email authentication failed:', error);
      setState(AuthState.ERROR);
      setContext((prev) => ({ ...prev, error: 'Email authentication failed' }));
    }
  };

  const verifyOTP = async (otp: string) => {
    setState(AuthState.CREATING_ACCOUNT);

    try {
      await verifyOneTimePassword(otp);
      setState(AuthState.WAITING_PRIMARY_WALLET);
    } catch (error) {
      console.error('❌ OTP verification failed:', error);
      setState(AuthState.ERROR);
      setContext((prev) => ({ ...prev, error: 'OTP verification failed' }));
    }
  };

  const startSocialAuthentication = async (provider: ProviderEnum) => {
    try {
      setState(AuthState.CREATING_ACCOUNT);
      setContext({ ...context });

      await signInWithSocialAccount(provider);

      setState(AuthState.AUTHENTICATED);
    } catch (error) {
      console.error('❌ Social authentication failed:', error);
      setState(AuthState.ERROR);
      setContext({ ...context, error: 'Social authentication failed' });
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
    startEmailAuthentication,
    verifyOTP,
    startSocialAuthentication,
    startSigningRequest,
    startTransactionRequest,
  };
}
