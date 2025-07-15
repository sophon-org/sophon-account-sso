import { env } from "@/env";
import { useAccountContext } from "./useAccountContext";
import { useCreateSession } from "./useCreateSession";
import type { AccountData, IncomingRequest } from "@/types/auth";

export function useAuthResponse() {
  const { account } = useAccountContext();
  const createSession = useCreateSession();

  const handleAuthSuccessResponse = async (
    accountData: AccountData,
    incomingRequest: IncomingRequest,
    sessionPreferences?: unknown
  ) => {
    if (!window.opener || !incomingRequest) {
      console.error("No RPC request to respond to!");
      return;
    }

    const responseAddress = account?.address || accountData.address;
    console.log(
      "🔥🔥🔥🔥🔥 responseAddress",
      responseAddress,
      accountData,
      account
    );

    let sessionData = null;
    if (sessionPreferences) {
      sessionData = await createSession();

      if (sessionData) {
        // Session created successfully
      } else {
        // Session creation failed
      }
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
                accountFactory: "0x0000000000000000000000000000000000000000",
                passkey: "0x0000000000000000000000000000000000000000",
                session: "0x0000000000000000000000000000000000000000",
                recovery: "0x0000000000000000000000000000000000000000",
                accountPaymaster: "0x0000000000000000000000000000000000000000",
              },
            },
          ],
        },
      },
    };

    window.opener.postMessage(rpcResponse, "*");

    // Clean up sessionStorage after successful response
    sessionStorage.removeItem("sophon-incoming-request");
  };

  return { handleAuthSuccessResponse };
}
