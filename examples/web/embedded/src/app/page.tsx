'use client';

import { useEffect } from 'react';
import { useAccountServer } from '../../components/account-server-frame';
import { ApproveDTNAction } from '../../components/actions/approve-dtn-action';
import { CloseAction } from '../../components/actions/close-action';
import { MintNFTAction } from '../../components/actions/mint-nft-action';
import { MintPaidNFTAction } from '../../components/actions/mint-paid-nft-action';
import { OpenAction } from '../../components/actions/open-action';
import { SendDTNAction } from '../../components/actions/send-dtn-action';
import { SendSophAction } from '../../components/actions/send-soph-action';
import { SignMessageAction } from '../../components/actions/sign-message-action';
import { SignTypedAction } from '../../components/actions/sign-typed-action';
import { UnverifiedAction } from '../../components/actions/unverified-action';
import { VerifiedComplexAction } from '../../components/actions/verified-complex-action';
import { VerifiedSimpleAction } from '../../components/actions/verified-simple-action';
import { Logo } from '../../components/logo';

const address = '0xF2D70927368140D67355465c4E07d39caB36aeC9';

export default function Home() {
  const { AccountServer, sendMessage } = useAccountServer({
    src: 'http://localhost:3000/embedded/123b216c-678e-4611-af9a-2d5b7b061258',
    className: 'w-full h-full',
  });

  // Listen for messages
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.origin === 'http://localhost:3000') {
        console.log('MESSAGE', event.origin, event.data, event);
      }
    };
    window.addEventListener('message', listener);
    return () => {
      window.removeEventListener('message', listener);
    };
  }, []);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="max-w-[390px] w-[390px] max-h-[844px] h-[844px] overflow-hidden border border-red-500/50">
        {AccountServer}
      </div>
      <div className="flex flex-col gap-2 max-w-md w-full items-center">
        <Logo className="mb-4" />
        <div className="flex flex-col gap-2 w-2/3">
          <OpenAction sendMessage={sendMessage} />
          <CloseAction sendMessage={sendMessage} />
          <SignMessageAction
            sendMessage={sendMessage}
            address={address}
            message="Hello world again!"
          />
          <SignTypedAction
            sendMessage={sendMessage}
            address={address}
            message="Hello from Sophon SSO!\\n\\nThis message confirms you control this wallet."
          />
          <SendSophAction sendMessage={sendMessage} address={address} />
          <SendDTNAction sendMessage={sendMessage} address={address} />
          <ApproveDTNAction sendMessage={sendMessage} address={address} />
          <MintNFTAction sendMessage={sendMessage} address={address} />
          <MintPaidNFTAction sendMessage={sendMessage} address={address} />
          <UnverifiedAction sendMessage={sendMessage} address={address} />
          <VerifiedSimpleAction sendMessage={sendMessage} address={address} />
          <VerifiedComplexAction sendMessage={sendMessage} address={address} />
        </div>
      </div>
    </div>
  );
}
