import { useSophonContext } from './use-sophon-context';

export const useSophonToken = () => {
  const { token } = useSophonContext();

  return {
    token,
  };
};
