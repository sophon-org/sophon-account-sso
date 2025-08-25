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
  const result = await sender('personal_sign', params);
  if (result?.content?.error) {
    throw new Error(result?.content?.error?.message);
  }
  return result?.content?.result;
};
