import { type ChainId, SophonChainCapabilities } from './constants';
import { type ChainCapability, ChainCapabilityValue } from './types';

/**
 * Check if the code is running on the server
 *
 * @returns True if the code is running on the server, false otherwise
 */
export const isSSR = () => {
  return typeof window === 'undefined';
};

/**
 * Check if the browser has localStorage. In some cases we have window available but no localStorage.
 *
 * @returns True if the browser has localStorage, false otherwise
 */
export const hasLocalStorage = () => {
  return typeof localStorage !== 'undefined';
};

export const checkChainCapability = (
  chainId: ChainId,
  capability: keyof ChainCapability,
) => {
  const value = SophonChainCapabilities[chainId][capability];
  return {
    disabled: value === ChainCapabilityValue.DISABLED,
    onChain: value === ChainCapabilityValue.ENABLED,
    offChain: value === ChainCapabilityValue.OFF_CHAIN,
  };
};
