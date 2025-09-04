'use client';
import { useEffect, useState } from 'react';
import { hexToString, toHex } from 'viem';
import { isValidPaymaster } from '@/lib/paymaster';
import { windowService } from '@/service/window.service';
import type {
  AuthenticationRequest,
  IncomingRequest,
  LogoutRequest,
  MessageSigningRequest,
  TransactionRequest,
  TypedDataSigningRequest,
} from '@/types/auth';

interface UseMessageHandlerReturn {
  incomingRequest: IncomingRequest | null;
  sessionPreferences: unknown;
  typedDataSigningRequest: TypedDataSigningRequest | null;
  messageSigningRequest: MessageSigningRequest | null;
  transactionRequest: TransactionRequest | null;
  authenticationRequest: AuthenticationRequest | null;
  logoutRequest: LogoutRequest | null;
  handlerInitialized: boolean;
}

export const useMessageHandler = (): UseMessageHandlerReturn => {
  const [handlerInitialized, setHandlerInitialized] = useState(false);
  const [incomingRequest, setIncomingRequest] =
    useState<IncomingRequest | null>(null);
  const [sessionPreferences, setSessionPreferences] = useState<unknown>(null);
  const [typedDataSigningRequest, setTypedDataSigningRequest] =
    useState<TypedDataSigningRequest | null>(null);
  const [messageSigningRequest, setMessageSigningRequest] =
    useState<MessageSigningRequest | null>(null);
  const [authenticationRequest, setAuthenticationRequest] =
    useState<AuthenticationRequest | null>(null);
  const [transactionRequest, setTransactionRequest] =
    useState<TransactionRequest | null>(null);
  const [logoutRequest, setLogoutRequest] = useState<LogoutRequest | null>(
    null,
  );

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
          setTypedDataSigningRequest(null);
          setMessageSigningRequest(null);
          setTransactionRequest(null);
          setAuthenticationRequest({
            domain: 'http://samplerequest.com',
          });
        } else if (method === 'wallet_requestPermissions') {
          // Handle wallet permissions as profile request
          setTypedDataSigningRequest(null);
          setMessageSigningRequest(null);
          setTransactionRequest(null);
          setSessionPreferences(null);
          setAuthenticationRequest({
            domain: 'profile',
            type: 'profile_view',
          });
        } else if (method === 'personal_sign') {
          const params = data.content.action?.params;
          if (params && params.length >= 2) {
            const messageHex = params[0];
            const address = params[1];
            const decodedMessage = hexToString(messageHex);

            setMessageSigningRequest({ message: decodedMessage, address });
            setSessionPreferences(null);
            setAuthenticationRequest(null);
            setTypedDataSigningRequest(null);
            setTransactionRequest(null);
          }
        } else if (
          method === 'wallet_revokePermissions' ||
          method === 'wallet_disconnect'
        ) {
          setLogoutRequest({
            reason: 'wallet_revoke_permissions',
          });

          setSessionPreferences(null);
          setAuthenticationRequest(null);
          setTypedDataSigningRequest(null);
          setMessageSigningRequest(null);
          setTransactionRequest(null);
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

              if (
                typedData.primaryType === 'Transaction' &&
                typedData.message?.txType === '113'
              ) {
                // ZKsync Transaction Type has addresses as uint, and this breaks the rest of the flow. So we convert here
                const transactionData = { ...typedData.message };
                transactionData.from = toHex(BigInt(transactionData.from), {
                  size: 20,
                });
                transactionData.to = toHex(BigInt(transactionData.to), {
                  size: 20,
                });
                transactionData.value = toHex(BigInt(transactionData.value));

                // Handle paymaster conversion with error handling
                let convertedPaymaster: string | undefined;
                try {
                  if (transactionData.paymaster) {
                    convertedPaymaster = toHex(
                      BigInt(transactionData.paymaster),
                      { size: 20 },
                    );
                  }
                } catch (error) {
                  console.warn(
                    'Invalid paymaster value:',
                    transactionData.paymaster,
                    error,
                  );
                  convertedPaymaster = undefined;
                }

                // only use the converted paymaster if it's valid
                transactionData.paymaster =
                  convertedPaymaster && isValidPaymaster(convertedPaymaster)
                    ? convertedPaymaster
                    : undefined;

                // not elegant, but it works
                transactionData.transactionType = 'eip712';
                transactionData.signingRequestData = signingRequestData;

                setTypedDataSigningRequest(null);
                setSessionPreferences(null);
                setAuthenticationRequest(null);
                setMessageSigningRequest(null);
                setTransactionRequest(transactionData);
              } else {
                setTypedDataSigningRequest(signingRequestData);
                setSessionPreferences(null);
                setAuthenticationRequest(null);
                setMessageSigningRequest(null);
                setTransactionRequest(null);
              }
            } catch (parseError) {
              console.error('Failed to parse typed data JSON:', parseError);
            }
          } else {
            console.error('Invalid params for eth_signTypedData_v4:', params);
          }
        } else if (method === 'eth_sendTransaction') {
          const params = data.content.action?.params;

          if (params && params.length >= 1) {
            let txData = params[0];

            if (
              txData.eip712Meta?.paymasterParams &&
              (txData.eip712Meta.paymasterParams.paymaster ||
                txData.eip712Meta.paymasterParams.paymasterInput)
            ) {
              const transactionData = { ...txData };
              transactionData.paymaster =
                transactionData.eip712Meta.paymasterParams.paymaster ||
                undefined;
              transactionData.paymasterInput =
                transactionData.eip712Meta.paymasterParams.paymasterInput ||
                undefined;
              delete transactionData.eip712Meta;
              txData = transactionData;
            }

            setTransactionRequest(txData);
            setTypedDataSigningRequest(null);
            setMessageSigningRequest(null);
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
    if (false && savedRequest && !incomingRequest) {
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

      // differently from Matter Labs auth-server example, we don't need to send
      // a PopupUnload signal because the popup is closed by the window service
    }

    // Define the message handler
    const unregister = windowService.listen(messageHandler);

    // wait a little before setting the handle initialized to give
    // time for the caller messages to be receive and avoid visual glitches
    setTimeout(() => {
      setHandlerInitialized(true);
    }, 500);

    return () => {
      unregister();
    };
  }, [incomingRequest]);

  return {
    incomingRequest,
    sessionPreferences,
    authenticationRequest,
    typedDataSigningRequest,
    messageSigningRequest,
    transactionRequest,
    handlerInitialized,
    logoutRequest,
  };
};
