import type { RequestSender } from '../types';

/**
 * Handle the eth_sendTransaction request.
 *
 * @param sender - The sender to use.
 * @param params - The parameters of the request.
 * @returns The result of the request.
 */
export const handleSendTransaction = async (
  sender: RequestSender<unknown>,
  params: unknown[],
) => {
  const result = await sender('eth_sendTransaction', params);
  if (result?.content?.error) {
    throw new Error(result?.content?.error?.message);
  }
  return result?.content?.result;
};
