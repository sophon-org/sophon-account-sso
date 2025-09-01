import { useContext } from 'react';
import { EthereumContext } from '../providers/EthereumProvider';

export const useEthereumContext = () => {
  const context = useContext(EthereumContext);
  if (!context) {
    throw new Error(
      'useEthereumContext must be used within an EthereumProvider',
    );
  }
  return context;
};
