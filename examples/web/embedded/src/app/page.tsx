'use client';

import { useEffect } from 'react';
import { useAccountServer } from '../../components/account-server-frame';
import { CloseAction } from '../../components/actions/close-action';
import { OpenAction } from '../../components/actions/open-action';
import { SignMessageAction } from '../../components/actions/sign-message-action';
import { SignTypedAction } from '../../components/actions/sign-typed-action';
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
        </div>
      </div>
    </div>
  );
}
