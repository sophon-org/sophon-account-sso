import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useState } from 'react';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { sendMessage } from '@/events';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useAuthResponse } from '@/hooks/useAuthResponse';
import { useSignature } from '@/hooks/useSignature';
import { SOPHON_VIEM_CHAIN } from '@/lib/constants';
import { withTimeout } from '@/lib/timeout';
import { requestNonce, verifyAuthorization } from '@/service/token.service';
import { windowService } from '@/service/window.service';

const AUTHORIZATION_TIMEOUT = 20000;

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
  const { isSigning, signTypeData, signingError } = useSignature();
  const [authorizing, setAuthorizing] = useState(false);
  const [authorizationError, setAuthorizationError] = useState<string | null>(
    null,
  );
  const { user } = useDynamicContext();

  const onRefuseConnection = async () => {
    setAuthorizationError(null); // Clear any errors when refusing connection

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

  // given that this evolves multiple api calls and it affects the state of the application,
  // we need to make sure that it has a time limit to be cancelled and make sure that we prevent the
  // promise to keep working after the user has cancelled the authorization or the time limit has been reached
  const onAcceptConnectionCall = async (isCanceled: () => boolean) => {
    if (!account) return;

    setAuthorizing(true);
    setAuthorizationError(null); // Clear any previous errors

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

      const messageFields = [
        { name: 'content', type: 'string' },
        { name: 'from', type: 'address' },
        { name: 'nonce', type: 'string' },
        { name: 'audience', type: 'string' },
      ];

      const message = {
        content: `Do you authorize this website to connect?!\n\nThis message confirms you control this wallet.`,
        from: account.address,
        nonce: authNonce,
        audience: partnerId,
      };

      const signAuth = {
        domain: {
          name: 'Sophon SSO',
          version: '1',
          chainId: SOPHON_VIEM_CHAIN.id,
        },
        types: {
          Message: user?.userId
            ? [...messageFields, { name: 'userId', type: 'string' }]
            : messageFields,
        },
        primaryType: 'Message',
        address: account.address,
        message: user?.userId ? { ...message, userId: user.userId } : message,
      };

      if (isCanceled()) {
        return;
      }

      const authSignature = await signTypeData(signAuth);
      if (isCanceled()) {
        return;
      }
      const {
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
      } = await verifyAuthorization(
        account.address,
        signAuth,
        authSignature,
        authNonce,
        true,
      );

      if (isCanceled()) {
        return;
      }

      // we don't store the token, we just send it during the account authorization
      windowService.emitAccessToken(accessToken, accessTokenExpiresAt);
      windowService.emitRefreshToken(refreshToken, refreshTokenExpiresAt);
    }

    if (windowService.isManaged() && incoming) {
      handleAuthSuccessResponse(
        { address: account.address },
        incoming,
        session,
      );
      actorRef.send({ type: 'ACCEPT' });
    }
  };

  const onAcceptConnection = async () => {
    let isCanceled = false;
    try {
      await withTimeout(
        onAcceptConnectionCall(() => isCanceled),
        AUTHORIZATION_TIMEOUT,
        'Authorization took too long, check your network and please try again.',
      );
    } catch (error) {
      isCanceled = true;
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Connection authorization failed';
      setAuthorizationError(errorMessage);
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
    authorizationError,
    signingError,
  };
}
