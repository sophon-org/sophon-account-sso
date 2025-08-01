import { useConnectWithOtp } from '@dynamic-labs/sdk-react-core';
import { useCallback } from 'react';
import { MainStateMachineContext } from '@/context/state-machine-context';

export function useOTPConnect() {
  const actorRef = MainStateMachineContext.useActorRef();

  const { connectWithEmail, verifyOneTimePassword } = useConnectWithOtp();

  const requestOTP = useCallback(
    async (email: string) => {
      try {
        await connectWithEmail(email);
        actorRef.send({ type: 'OTP_SENT' });
      } catch (error) {
        console.error('❌ Email authentication failed:', error);
        actorRef.send({
          type: 'SET_ERROR',
          error: 'Email authentication failed',
        });
      }
    },
    [actorRef, connectWithEmail],
  );

  const verifyOTP = useCallback(
    async (otp: string) => {
      try {
        await verifyOneTimePassword(otp);
        actorRef.send({ type: 'OTP_VERIFIED' });
      } catch (error) {
        console.error('❌ OTP verification failed:', error);
        actorRef.send({ type: 'SET_ERROR', error: 'OTP verification failed' });
      }
    },
    [actorRef, verifyOneTimePassword],
  );

  return {
    requestOTP,
    verifyOTP,
  };
}
