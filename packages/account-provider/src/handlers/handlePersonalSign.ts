import { RpcError } from 'viem';
import type { RequestSender } from '../types';

/**
 * Handle the personal_sign request.
 *
 * @param sender - The sender to use.
 * @param params - The parameters of the request.
 * @returns The result of the request.
 */
export const handlePersonalSign = async (
  sender: RequestSender<unknown>,
  params: unknown[],
) => {
  const response = await sender('personal_sign', params);
  if (response?.content?.error) {
    throw new RpcError(new Error(response?.content?.error?.message), {
      code: response?.content?.error?.code,
      shortMessage: response?.content?.error?.message,
    });
  }
  return response?.content?.result;
};
