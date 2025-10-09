import { useCallback, useState } from 'react';
import { MainStateMachineContext } from '@/context/state-machine-context';
import {
  trackAuthCompleted,
  trackAuthFailed,
  updateUserProperties,
} from '@/lib/analytics';

export function useOTPConnect() {
  const actorRef = MainStateMachineContext.useActorRef();
  const [error, setError] = useState<string | null>(null);

  // const { connectWithEmail, verifyOneTimePassword, retryOneTimePassword } =
  //   useEmailAuth();

  const requestOTP = useCallback(
    async (email: string) => {
      try {
        // await connectWithEmail(email);

        // Update user properties with email info
        updateUserProperties({
          email,
          authMethod: 'email',
          otp_sent_at: new Date().toISOString(),
        });

        actorRef.send({ type: 'OTP_SENT', email });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Email authentication failed';
        setError(errorMessage);
        console.error('❌ Email authentication failed:', error);
        trackAuthFailed('email', errorMessage, 'otp_request');
        actorRef.send({
          type: 'SET_ERROR',
          error: 'Email authentication failed',
        });
      }
    },
    [actorRef],
  );

  const verifyOTP = useCallback(
    async (otp: string) => {
      try {
        // await verifyOneTimePassword(otp);
        trackAuthCompleted('email');

        // Update user properties on successful verification
        updateUserProperties({
          email_verified_at: new Date().toISOString(),
          otp_verification_success: true,
        });

        actorRef.send({ type: 'OTP_VERIFIED' });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'OTP verification failed';
        setError(errorMessage);
        console.error('❌ OTP verification failed:', error);
        trackAuthFailed('email', errorMessage, 'otp_verification');
        actorRef.send({ type: 'SET_ERROR', error: 'OTP verification failed' });
      }
    },
    [actorRef],
  );

  const resendOTP = useCallback(async () => {
    // try {
    //   // await retryOneTimePassword();
    // } catch (error) {
    //   console.error('❌ OTP resend failed:', error);
    //   const errorMessage =
    //     error instanceof Error ? error.message : 'OTP resend failed';
    //   setError(errorMessage);
    //   actorRef.send({ type: 'SET_ERROR', error: 'OTP resend failed' });
    // }
  }, []);

  return {
    requestOTP,
    verifyOTP,
    resendOTP,
    otpError: error,
  };
}
