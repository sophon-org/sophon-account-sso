'use client';

import { sendMessageToRN } from '@sophon-labs/account-message-bridge';
import { useState } from 'react';
import { sophonTestnet } from 'viem/chains';
import { IconSignature } from '@/components/icons/icon-signature';
import { IconGreenCheck } from '@/components/icons/icons-green-check';
import { IconRedCheck } from '@/components/icons/icons-red-check';
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import MessageContainer from '@/components/ui/messageContainer';
import VerificationImage from '@/components/ui/verification-image';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useAuthResponse } from '@/hooks/useAuthResponse';
import { useSignature } from '@/hooks/useSignature';
import { requestNonce, verifyAuthorization } from '@/service/token.service';
import { windowService } from '@/service/window.service';

export default function ConnectAuthorizationView() {
  const { handleAuthSuccessResponse } = useAuthResponse();
  const { incoming, authentication, session } =
    MainStateMachineContext.useSelector((state) => state.context.requests);
  const { account } = useAccountContext();
  const actorRef = MainStateMachineContext.useActorRef();
  const { isSigning, signTypeData } = useSignature();
  const [authorizing, setAuthorizing] = useState(false);

  if (!authentication || !incoming || !account) {
    return <div>No authentication request or account present</div>;
  }

  const onRefuseConnection = () => {
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

      windowService.sendMessage(signResponse);
      actorRef.send({ type: 'CANCEL' });
    }
  };

  const onAcceptConnection = async () => {
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
      sendMessageToRN('account.token.emitted', token);

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

  return (
    <div className="text-center flex flex-col items-center justify-center gap-8 mt-6 px-6">
      <VerificationImage icon={<IconSignature className="w-24 h-24" />} />
      <div className="flex flex-col items-center justify-center">
        <h5 className="text-2xl font-bold">Connection request</h5>
        <p className="hidden">https://my.staging.sophon.xyz</p>
      </div>
      <MessageContainer>
        <div className="text-sm text-black">
          <p className="font-bold my-2">It can</p>
          <ul>
            <li className="my-4">
              <IconGreenCheck className="mr-2 inline" /> See you
              address/identity, balances and activity
            </li>
            <li>
              <IconGreenCheck className="mr-2 inline" />
              Ask for transactions to be approved
            </li>
          </ul>
          <p className="font-bold mt-6 mb-4">It can't</p>
          <ul>
            <li>
              <IconRedCheck className="mr-2 inline" />
              Perform actions or transfer funds on your behalf
            </li>
          </ul>
        </div>
      </MessageContainer>

      <div className="flex items-center justify-center gap-2 w-full">
        <Button
          disabled={authorizing}
          variant="transparent"
          onClick={onRefuseConnection}
        >
          Cancel
        </Button>
        <Button type="button" onClick={onAcceptConnection}>
          {isSigning || authorizing ? (
            <Loader className="w-4 h-4 border-black border-r-transparent" />
          ) : (
            'Connect'
          )}
        </Button>
      </div>
    </div>
  );
}
