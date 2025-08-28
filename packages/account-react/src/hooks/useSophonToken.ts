import { useSophonContext } from './useSophonContext';

/**
 * Hook that handles the authentication token and the logic regarging its refreshing
 */
export const useSophonToken = () => {
  const { token } = useSophonContext();

  return {
    token,
  };
};
