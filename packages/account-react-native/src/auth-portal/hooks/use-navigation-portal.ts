import { useContext, useMemo } from "react";
import { AuthPortalContext } from "../context/auth-sheet.context";

/**
 * @function useNavigationPortal
 * Custom hook to access navigation functions from the AuthPortal context.
 * @returns An object containing navigation functions.
 */
export function useNavigationPortal() {
  const context = useContext(AuthPortalContext);
  if (!context) throw new Error("useAuthPortal must be used within AuthPortalProvider");
  const { navigate, goBack, setParams } = context;
  return useMemo(() => ({ navigate, goBack, setParams }), [navigate, goBack, setParams]);
}
