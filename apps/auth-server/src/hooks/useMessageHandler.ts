"use client";
import { useEffect, useState } from "react";
import type {
  IncomingRequest,
  SigningRequest,
  TransactionRequest,
} from "@/types/auth";
import { windowService } from "@/service/window.service";

interface UseMessageHandlerReturn {
  incomingRequest: IncomingRequest | null;
  sessionPreferences: unknown;
  signingRequest: SigningRequest | null;
  transactionRequest: TransactionRequest | null;
}

interface UseMessageHandlerCallbacks {
  onSigningRequest?: (request: SigningRequest) => void;
  onTransactionRequest?: (request: TransactionRequest) => void;
}

export const useMessageHandler = (
  callbacks?: UseMessageHandlerCallbacks
): UseMessageHandlerReturn => {
  const [incomingRequest, setIncomingRequest] =
    useState<IncomingRequest | null>(null);
  const [sessionPreferences, setSessionPreferences] = useState<unknown>(null);
  const [signingRequest, setSigningRequest] = useState<SigningRequest | null>(
    null
  );
  const [transactionRequest, setTransactionRequest] =
    useState<TransactionRequest | null>(null);

  useEffect(() => {
    // Check sessionStorage for saved request (survives OAuth redirects)
    const savedRequest = sessionStorage.getItem("sophon-incoming-request");
    if (savedRequest && !incomingRequest) {
      try {
        const parsedRequest = JSON.parse(savedRequest);
        setIncomingRequest(parsedRequest);
      } catch (error) {
        console.error("Failed to parse saved request:", error);
        sessionStorage.removeItem("sophon-incoming-request");
      }
    }

    // Initialize popup communication
    const urlParams = new URLSearchParams(window.location.search);
    const origin = urlParams.get("origin");

    // Send the exact PopupLoaded signal that ZKsync SSO expects
    if (origin && windowService.isManaged()) {
      const popupLoadedSignal = {
        event: "PopupLoaded",
        id: crypto.randomUUID(),
      };
      windowService.sendMessage(popupLoadedSignal);
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

              const signingRequestData = {
                domain: typedData.domain,
                types: typedData.types,
                primaryType: typedData.primaryType,
                message: typedData.message,
                address: address,
              };

              setSigningRequest(signingRequestData);
              setSessionPreferences(null);

              if (callbacks?.onSigningRequest) {
                callbacks.onSigningRequest(signingRequestData);
              }
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

            const transactionRequestData = {
              to: txData.to,
              value: txData.value || "0x0",
              data: txData.data || "0x",
              from: txData.from,
              paymaster: txData.paymaster,
            };

            setTransactionRequest(transactionRequestData);
            setSigningRequest(null);
            setSessionPreferences(null);

            if (callbacks?.onTransactionRequest) {
              callbacks.onTransactionRequest(transactionRequestData);
            }
          }
        }

        setIncomingRequest(event.data);

        // Save to sessionStorage (survives OAuth redirects when social auth is used)
        sessionStorage.setItem(
          "sophon-incoming-request",
          JSON.stringify(event.data)
        );
      }
    };

    window.addEventListener("message", messageHandler);

    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, [callbacks, incomingRequest]);

  return {
    incomingRequest,
    sessionPreferences,
    signingRequest,
    transactionRequest,
  };
};
