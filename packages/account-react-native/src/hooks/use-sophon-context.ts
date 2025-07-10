import { SophonAccountContext } from '../provider';
import { useContext } from 'react';

export const useSophonContext = () => {
  const context = useContext(SophonAccountContext);
  if (!context) {
    throw new Error(
      'useSophonContext must be used within a SophonAccountProvider'
    );
  }
  return context;
};
