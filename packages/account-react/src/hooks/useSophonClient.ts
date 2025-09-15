import { useSophonContext } from './useSophonContext';

export const useSophonClient = () => {
  const { walletClient } = useSophonContext();

  return {
    walletClient,
  };
};
