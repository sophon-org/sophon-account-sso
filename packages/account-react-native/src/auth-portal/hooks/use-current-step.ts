import { useMemo } from 'react';
import { useSophonAccount } from '../../hooks';
import { useFlowManager } from '../../hooks/use-flow-manager';
import { useSophonContext } from '../../hooks/use-sophon-context';
import type { AuthPortalStep } from '../types';

export function useCurrentStep(currentState: AuthPortalStep): AuthPortalStep {
  const { method } = useFlowManager();
  const { isConnected, account } = useSophonAccount();
  const { connectingAccount } = useSophonContext();
  return useMemo<AuthPortalStep>(() => {
    if (currentState) return currentState;
    switch (method) {
      case 'eth_requestAccounts':
      case 'wallet_requestPermissions':
        return isConnected || connectingAccount ? 'authorization' : 'signIn';
      case 'personal_sign':
      case 'eth_signTypedData_v4':
        return 'signMessage';
      case 'eth_sendTransaction':
        return 'transaction';
      case 'sophon_requestConsent':
        return 'consent';
      // case 'wallet_revokePermissions':
      // case 'wallet_disconnect':
      default:
        if (!account) return 'signIn';
        return null;
    }
  }, [method, currentState]);
}
