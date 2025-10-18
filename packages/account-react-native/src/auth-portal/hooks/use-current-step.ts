import { useFlowManager } from "../../hooks/use-flow-manager";
import { useMemo } from "react";
import type { AuthPortalStep } from "../types";
import { useSophonAccount } from "../../hooks";
import { useSophonContext } from "../../hooks/use-sophon-context";

export function useCurrentStep(currentState: AuthPortalStep): AuthPortalStep {
  const { method } = useFlowManager();
  const { isConnected } = useSophonAccount();
  const { connectingAccount } = useSophonContext();
  return useMemo<AuthPortalStep>(() => {
    switch (method) {
      case "eth_requestAccounts":
      case "wallet_requestPermissions":
        return isConnected || connectingAccount ? "authorization" : "signIn";
      case "personal_sign":
      case "eth_signTypedData_v4":
        return "signMessage";
      case "eth_sendTransaction":
        return "transaction";
      case "sophon_requestConsent":
        return "consent";
      // case 'wallet_revokePermissions':
      // case 'wallet_disconnect':
      default:
        return currentState;
    }
  }, [currentState]);
}
