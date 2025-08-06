import { useState } from 'react';
import { sophonTestnet } from 'viem/chains';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { sendMessage } from '@/events';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useAuthResponse } from '@/hooks/useAuthResponse';
import { useSignature } from '@/hooks/useSignature';
import { requestNonce, verifyAuthorization } from '@/service/token.service';
import { windowService } from '@/service/window.service';

export function useConnectionAuthorization() {
  const { handleAuthSuccessResponse } = useAuthResponse();
  const { incoming, session } = MainStateMachineContext.useSelector(
    (state) => state.context.requests,
  );
  const { account } = useAccountContext();
  const actorRef = MainStateMachineContext.useActorRef();
  const { isSigning, signTypeData } = useSignature();
  const [authorizing, setAuthorizing] = useState(false);

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

      const authNonce = await requestNonce(account.address);
      const signAuth = {
        domain: {
          name: 'Sophon SSO',
          version: '1',
          chainId: sophonTestnet.id,
        },
        types: {
          Message: [
            { name: 'content', type: 'string' },
            { name: 'from', type: 'address' },
            { name: 'nonce', type: 'string' },
          ],
        },
        primaryType: 'Message',
        address: account.address,
        message: {
          content: `Do you authorize this website to connect?!\n\nThis message confirms you control this wallet.`,
          from: account.address,
          nonce: authNonce,
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

      // we don't store the token, we just send it during the account authorization
      // TODO: better handling token expiration
      windowService.emitToken(token);

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
