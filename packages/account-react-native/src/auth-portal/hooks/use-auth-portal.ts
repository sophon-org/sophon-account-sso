import { useContext, useMemo } from 'react';
import { AuthPortalContext } from '../context/auth-sheet.context';

/**
 * @function useAuthPortal
 * Custom hook to access the AuthPortal context.
 * @returns The AuthPortal context.
 */
export function useAuthPortal() {
  const context = useContext(AuthPortalContext);
  if (!context)
    throw new Error('useAuthPortal must be used within AuthPortalProvider');
  return context;
}

/**
 * @function useNavigationParams
 * Custom hook to access navigation parameters from the AuthPortal context.
 * @returns The navigation parameters.
 */
export function useNavigationParams<T>() {
  const { params } = useAuthPortal();
  return useMemo(() => params as T, [params]);
}
/**
 * @function useNavigationPortal
 * Custom hook to access navigation functions from the AuthPortal context.
 * @returns An object containing navigation functions.
 */
export function useNavigationPortal() {
  const { navigate, goBack, setParams } = useAuthPortal();
  return useMemo(
    () => ({ navigate, goBack, setParams }),
    [navigate, goBack, setParams],
  );
}
