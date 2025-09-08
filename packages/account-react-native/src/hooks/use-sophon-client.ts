import { useSophonContext } from './use-sophon-context';

export const useSophonClient = () => {
  const { walletClient } = useSophonContext();

  return {
    walletClient,
  };
};
