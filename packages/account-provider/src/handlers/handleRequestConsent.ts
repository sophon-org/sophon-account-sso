import { RpcError } from 'viem';
import type { RequestSender } from '../types';

/**
 * Handle the sophon_requestConsent request.
 *
 * @param sender - The sender to use.
 * @param params - The parameters of the request.
 * @returns The result of the request.
 */
export const handleRequestConsent = async (
  sender: RequestSender<unknown>,
  params: unknown[],
) => {
  const result = await sender('sophon_requestConsent', params);
  if (result?.content?.error) {
    throw new RpcError(new Error(result?.content?.error?.message), {
      code: result?.content?.error?.code,
      shortMessage: result?.content?.error?.message,
    });
  }
  return result?.content?.result;
};
