import { useSophonContext } from './useSophonContext';

export const useSophonConnector = () => {
  const { connector } = useSophonContext();
  return { connector };
};
