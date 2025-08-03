'use client';
import { useEffect, useState } from 'react';
import { windowService } from '@/service/window.service';
import type {
  AuthenticationRequest,
  IncomingRequest,
  SigningRequest,
  TransactionRequest,
} from '@/types/auth';

interface UseMessageHandlerReturn {
  incomingRequest: IncomingRequest | null;
  sessionPreferences: unknown;
  signingRequest: SigningRequest | null;
  transactionRequest: TransactionRequest | null;
  authenticationRequest: AuthenticationRequest | null;
  handlerInitialized: boolean;
}

export const useMessageHandler = (): UseMessageHandlerReturn => {
  const [handlerInitialized, setHandlerInitialized] = useState(false);
  const [incomingRequest, setIncomingRequest] =
    useState<IncomingRequest | null>(null);
  const [sessionPreferences, setSessionPreferences] = useState<unknown>(null);
  const [signingRequest, setSigningRequest] = useState<SigningRequest | null>(
    null,
  );
  const [authenticationRequest, setAuthenticationRequest] =
    useState<AuthenticationRequest | null>(null);
  const [transactionRequest, setTransactionRequest] =
    useState<TransactionRequest | null>(null);

  useEffect(() => {
    // biome-ignore lint/suspicious/noExplicitAny: review that in the future TODO
    const messageHandler = (data: any) => {
      // Store the incoming request if it's an RPC request
      if (data?.id && data?.content) {
        const method = data.content?.action?.method;

        if (method === 'eth_requestAccounts') {
          const params = data.content.action?.params as
            | { sessionPreferences?: unknown }
            | undefined;
          const isSessionRequest = !!params?.sessionPreferences;

          if (isSessionRequest) {
            setSessionPreferences(params?.sessionPreferences);
          } else {
            setSessionPreferences(null);
          }
          setSigningRequest(null);
          setTransactionRequest(null);
          setAuthenticationRequest({
            domain: 'http://samplerequest.com',
          });
        } else if (method === 'eth_signTypedData_v4') {
          const params = data.content.action?.params;

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
              setAuthenticationRequest(null);
            } catch (parseError) {
              console.error('Failed to parse typed data JSON:', parseError);
            }
          } else {
            console.error('Invalid params for eth_signTypedData_v4:', params);
          }
        } else if (method === 'eth_sendTransaction') {
          const params = data.content.action?.params;

          if (params && params.length >= 1) {
            const txData = params[0];

            const transactionRequestData = {
              to: txData.to,
              value: txData.value || '0x0',
              data: txData.data || '0x',
              from: txData.from,
              paymaster: txData.paymaster,
            };

            setTransactionRequest(transactionRequestData);
            setSigningRequest(null);
            setSessionPreferences(null);
            setAuthenticationRequest(null);
          }
        }

        setIncomingRequest(data);

        // Save to sessionStorage (survives OAuth redirects when social auth is used)
        sessionStorage.setItem('sophon-incoming-request', JSON.stringify(data));
      }
    };

    // Check sessionStorage for saved request (survives OAuth redirects)
    const savedRequest = sessionStorage.getItem('sophon-incoming-request');
    if (savedRequest && !incomingRequest) {
      try {
        const parsedRequest = JSON.parse(savedRequest);
        messageHandler(parsedRequest);
      } catch (error) {
        console.error('Failed to parse saved request:', error);
        sessionStorage.removeItem('sophon-incoming-request');
      }
    }

    // Initialize popup communication
    const urlParams = new URLSearchParams(window.location.search);
    const origin = urlParams.get('origin');

    // Send the exact PopupLoaded signal that ZKsync SSO expects
    if (origin && windowService.isManaged()) {
      const popupLoadedSignal = {
        event: 'PopupLoaded',
        id: crypto.randomUUID(),
      };
      windowService.sendMessage(popupLoadedSignal);
    }

    // Define the message handler

    const unregister = windowService.listen(messageHandler);
    setHandlerInitialized(true);

    return () => {
      unregister();
    };
  }, [incomingRequest]);

  return {
    incomingRequest,
    sessionPreferences,
    authenticationRequest,
    signingRequest,
    transactionRequest,
    handlerInitialized,
  };
};
