import { useContext } from "react";
import { AuthPortalContext } from "../context/auth-sheet.context";

/**
 * @function useAuthPortal
 * Custom hook to access the AuthPortal context.
 * @returns The AuthPortal context.
 */
export function useAuthPortal() {
  const context = useContext(AuthPortalContext);
  if (!context) throw new Error("useAuthPortal must be used within AuthPortalProvider");
  return context;
}
