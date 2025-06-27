"use client";
import { useEffect, useState } from "react";
import type {
  IncomingRequest,
  SigningRequest,
  TransactionRequest,
} from "@/types/auth";

interface UseMessageHandlerReturn {
  incomingRequest: IncomingRequest | null;
  sessionPreferences: unknown;
  signingRequest: SigningRequest | null;
  transactionRequest: TransactionRequest | null;
}

export const useMessageHandler = (): UseMessageHandlerReturn => {
  const [incomingRequest, setIncomingRequest] =
    useState<IncomingRequest | null>(null);
  const [sessionPreferences, setSessionPreferences] = useState<unknown>(null);
  const [signingRequest, setSigningRequest] = useState<SigningRequest | null>(
    null
  );
  const [transactionRequest, setTransactionRequest] =
    useState<TransactionRequest | null>(null);

  useEffect(() => {
    // Initialize popup communication
    const urlParams = new URLSearchParams(window.location.search);
    const origin = urlParams.get("origin");

    // Send the exact PopupLoaded signal that ZKsync SSO expects
    if (origin && window.opener) {
      const popupLoadedSignal = {
        event: "PopupLoaded",
        id: crypto.randomUUID(),
      };
      window.opener.postMessage(popupLoadedSignal, "*");
    }

    // Define the message handler
    const messageHandler = (event: MessageEvent) => {
      // Store the incoming request if it's an RPC request
      if (event.data && event.data.id && event.data.content) {
        const method = event.data.content?.action?.method;

        if (method === "eth_requestAccounts") {
          const params = event.data.content.action?.params as
            | { sessionPreferences?: unknown }
            | undefined;
          const isSessionRequest = !!params?.sessionPreferences;

          if (isSessionRequest) {
            setSessionPreferences(params?.sessionPreferences);
          } else {
            setSessionPreferences(null);
          }
          setSigningRequest(null);
        } else if (method === "eth_signTypedData_v4") {
          const params = event.data.content.action?.params;

          if (params && params.length >= 2) {
            const address = params[0];
            const typedDataJson = params[1];

            try {
              const typedData = JSON.parse(typedDataJson);

              setSigningRequest({
                domain: typedData.domain,
                types: typedData.types,
                primaryType: typedData.primaryType,
                message: typedData.message,
                address: address,
              });

              setSessionPreferences(null);
            } catch (parseError) {
              console.error("Failed to parse typed data JSON:", parseError);
            }
          } else {
            console.error("Invalid params for eth_signTypedData_v4:", params);
          }
        } else if (method === "eth_sendTransaction") {
          const params = event.data.content.action?.params;

          if (params && params.length >= 1) {
            const txData = params[0];

            setTransactionRequest({
              to: txData.to,
              value: txData.value || "0x0",
              data: txData.data || "0x",
              from: txData.from,
              paymaster: txData.paymaster,
            });

            setSigningRequest(null);
            setSessionPreferences(null);
          }
        }

        setIncomingRequest(event.data);
      }
    };

    // Add event listener
    window.addEventListener("message", messageHandler);

    // Cleanup function
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []); // Empty dependency array - this effect should run once on mount

  return {
    incomingRequest,
    sessionPreferences,
    signingRequest,
    transactionRequest,
  };
};
