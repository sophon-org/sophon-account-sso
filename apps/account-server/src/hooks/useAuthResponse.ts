import { env } from '@/env';
import { windowService } from '@/service/window.service';
import type { AccountData, IncomingRequest } from '@/types/auth';
import { useAccountContext } from './useAccountContext';
import { useCreateSession } from './useCreateSession';
import { sendMessage } from '@/events';

export function useAuthResponse() {
  const { account } = useAccountContext();
  const createSession = useCreateSession();

  const handleAuthSuccessResponse = async (
    accountData: AccountData,
    incomingRequest: IncomingRequest,
    sessionPreferences?: unknown,
  ) => {
    if (!windowService.isManaged() || !incomingRequest) {
      console.error('No RPC request to respond to!');
      return;
    }

    const responseAddress = account?.address || accountData.address;

    let sessionData = null;
    if (sessionPreferences) {
      sessionData = await createSession();

      if (sessionData) {
        // Session created successfully
      } else {
        // Session creation failed
      }
    }

    const token =
      '4507f8a7594b1094a3a26439a0379a42a1d0caf97890dbe7ba8f8ab3c461581b';
    if (token) {
      sendMessage('account.token.emitted', token);
    }

    const rpcResponse = {
      id: crypto.randomUUID(),
      requestId: incomingRequest.id,
      content: {
        result: {
          account: {
            address: responseAddress,
            activeChainId: env.NEXT_PUBLIC_CHAIN_ID,
            ...(sessionData && { session: sessionData }),
          },
          chainsInfo: [
            {
              id: env.NEXT_PUBLIC_CHAIN_ID,
              capabilities: {
                paymasterService: { supported: true },
                atomicBatch: { supported: true },
                auxiliaryFunds: { supported: true },
              },
              contracts: {
                accountFactory: '0x0000000000000000000000000000000000000000',
                passkey: '0x0000000000000000000000000000000000000000',
                session: '0x0000000000000000000000000000000000000000',
                recovery: '0x0000000000000000000000000000000000000000',
                accountPaymaster: '0x0000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    };

    windowService.sendMessage(rpcResponse);

    // Clean up sessionStorage after successful response
    sessionStorage.removeItem('sophon-incoming-request');
  };

  return { handleAuthSuccessResponse };
}
