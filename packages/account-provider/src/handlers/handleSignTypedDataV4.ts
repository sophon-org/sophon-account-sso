import type { RequestSender } from '../types';

/**
 * Handle the eth_signTypedData_v4 request.
 *
 * @param sender - The sender to use.
 * @param params - The parameters of the request.
 * @returns The result of the request.
 */
export const handleSignTypedDataV4 = async (
  sender: RequestSender<unknown>,
  params: unknown[],
) => {
  const result = await sender('eth_signTypedData_v4', params);
  if (result?.content?.error) {
    throw new Error(result?.content?.error?.message);
  }
  return result?.content?.result;
};
