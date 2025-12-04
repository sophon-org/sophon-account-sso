import { useContext, useMemo } from 'react';
import { AuthPortalContext } from '../context/auth-sheet.context';

/**
 * @function useNavigationParams
 * Custom hook to access navigation parameters from the AuthPortal context.
 * @returns The navigation parameters.
 */
export function useNavigationParams<T>() {
  const context = useContext(AuthPortalContext);
  if (!context)
    throw new Error('useAuthPortal must be used within AuthPortalProvider');
  const { params = {} } = context;

  return useMemo(() => (params || {}) as T, [params]);
}
