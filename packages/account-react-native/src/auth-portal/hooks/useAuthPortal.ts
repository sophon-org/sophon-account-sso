import { useContext, useMemo } from "react";
import { AuthPortalContext } from "../context/auth-sheet.context";

export function useAuthPortal() {
  const context = useContext(AuthPortalContext);
  if (!context) throw new Error("useAuthPortal must be used within AuthPortalProvider");
  return context;
}

export function useNavigationParams<T>() {
  const { params } = useAuthPortal();
  return useMemo(() => params as T, [params]);
}
