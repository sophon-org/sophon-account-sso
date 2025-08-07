import { useEOAConnect } from './useEOAConnect';
import { useEOASwitchNetwork } from './useEOASwitchNetwork';
import { useOTPConnect } from './useOTPConnect';
import { useSocialConnect } from './useSocialConnect';

export function useAuthCallbacks() {
  const { requestOTP, verifyOTP, resendOTP } = useOTPConnect();

  return {
    connectEOA: useEOAConnect(),
    switchEOANetwork: useEOASwitchNetwork(),
    requestOTP,
    verifyOTP,
    resendOTP,
    connectSocial: useSocialConnect(),
  };
}
