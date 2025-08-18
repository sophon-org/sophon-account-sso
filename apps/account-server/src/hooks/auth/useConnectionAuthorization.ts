import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useState } from 'react';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { sendMessage } from '@/events';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useAuthResponse } from '@/hooks/useAuthResponse';
import { useSignature } from '@/hooks/useSignature';
import { VIEM_CHAIN } from '@/lib/constants';
import { serverLog } from '@/lib/server-log';
import { requestNonce, verifyAuthorization } from '@/service/token.service';
import { windowService } from '@/service/window.service';

export function useConnectionAuthorization() {
  const { handleAuthSuccessResponse } = useAuthResponse();
  const { incoming, session } = MainStateMachineContext.useSelector(
    (state) => state.context.requests,
  );
  const scopes = MainStateMachineContext.useSelector(
    (state) => state.context.scopes,
  );
  const partnerId = MainStateMachineContext.useSelector(
    (state) => state.context.partnerId,
  );
  const { account } = useAccountContext();
  const actorRef = MainStateMachineContext.useActorRef();
  const { isSigning, signTypeData } = useSignature();
  const [authorizing, setAuthorizing] = useState(false);
  const { user } = useDynamicContext();

  const onRefuseConnection = async () => {
    if (windowService.isManaged() && incoming) {
      const signResponse = {
        id: crypto.randomUUID(),
        requestId: incoming.id,
        content: {
          result: null,
          error: {
            message: 'User cancelled signing',
            code: -32002,
          },
        },
      };

      sendMessage('smart-contract.logout', null);

      // TODO: find a better way to handle this
      // this is a workaround to avoid the logout message being sent after the window is closed
      setTimeout(() => {
        windowService.sendMessage(signResponse);
        actorRef.send({ type: 'CANCEL' });
      }, 10);
    }
  };

  const onAcceptConnection = async () => {
    if (!account) return;

    try {
      setAuthorizing(true);

      // We just generate tokens if the partnerId is available,
      // otherwise the partner is using EIP-6963 and don't need that
      if (partnerId) {
        const authNonce = await requestNonce(
          account.address,
          partnerId,
          Object.keys(scopes)
            .filter((it) => scopes[it as keyof typeof scopes])
            .map((it) => it.toString()),
          user?.userId,
        );

        const signAuth = {
          domain: {
            name: 'Sophon SSO',
            version: '1',
            chainId: VIEM_CHAIN.id,
          },
          types: {
            Message: [
              { name: 'content', type: 'string' },
              { name: 'from', type: 'address' },
              { name: 'nonce', type: 'string' },
              { name: 'audience', type: 'string' },
              { name: 'userId', type: 'string' },
            ],
          },
          primaryType: 'Message',
          address: account.address,
          message: {
            content: `Do you authorize this website to connect?!\n\nThis message confirms you control this wallet.`,
            from: account.address,
            nonce: authNonce,
            audience: partnerId,
            userId: user?.userId,
          },
        };

        const authSignature = await signTypeData(signAuth);

        const token = await verifyAuthorization(
          account.address,
          signAuth,
          authSignature,
          authNonce,
          true,
        );

        serverLog(`Token: ${token}`);

        // we don't store the token, we just send it during the account authorization
        // TODO: better handling token expiration
        windowService.emitToken(token);
      }

      if (windowService.isManaged() && incoming) {
        handleAuthSuccessResponse(
          { address: account.address },
          incoming,
          session,
        );
        actorRef.send({ type: 'ACCEPT' });
      }
    } finally {
      setAuthorizing(false);
    }
  };

  return {
    onRefuseConnection,
    onAcceptConnection,
    isAuthorizing: authorizing,
    isSigning,
    isLoading: isSigning || authorizing,
  };
}
