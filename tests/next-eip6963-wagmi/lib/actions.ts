import { signMessage, signTypedData } from 'wagmi/actions';
import { wagmiConfig } from './wagmi';

export const testableActions = {
  signMessage,
  signTypedData,
};

export const executeWagmiAction = async (
  action: keyof typeof testableActions,
  // biome-ignore lint/suspicious/noExplicitAny: ignore for sake of dynamic testing
  args: any,
) => {
  return await testableActions[action](wagmiConfig, args);
};
