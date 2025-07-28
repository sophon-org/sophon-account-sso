'use client';

import { useEffect } from 'react';
import { Dialog } from '@/components/dialog';
import { Button } from '@/components/ui/button';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { sendMessage } from '@/events';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { shortenAddress } from '@/lib/formatting';
import { serverLog } from '@/lib/server-log';
import { windowService } from '@/service/window.service';
import { CompletedView } from '@/views/CompletedView';
import ConnectAuthorizationView from '@/views/ConnectAuthorizationView';
import { LoadingView } from '@/views/LoadingView';
import LoginSuccessView from '@/views/LoginSuccessView';
import { NotAuthenticatedView } from '@/views/NotAuthenticatedView';
import SelectingWalletView from '@/views/SelectingWalletView';
import SigningRequestView from '@/views/SigningRequestView';
import TransactionRequestView from '@/views/TransactionRequestView';
import WaitOtpView from '@/views/WaitOtpView';
import WrongNetworkView from '@/views/WrongNetworkView';

export default function RootPage() {
  const state = MainStateMachineContext.useSelector((state) => state);
  const actorRef = MainStateMachineContext.useActorRef();

  const { account } = useAccountContext();
  const { disconnect } = useWalletConnection();

  useEffect(() => {
    serverLog(JSON.stringify(state));
  }, [state]);

  /***************************
   * LOADING RESOURCES STATE *
   ***************************/
  if (state.matches('loading')) {
    return (
      <Dialog className="relative" showLegalNotice={false}>
        <LoadingView message="Loading..." />
      </Dialog>
    );
  }

  /***************************
   * INCOMING REQUESTS STATE *
   ***************************/
  if (state.matches('incoming-signature')) {
    return (
      <Dialog
        className="relative"
        title={shortenAddress(account?.address ?? '')}
        onSettings={() => {
          window.parent.open('https://app.sophon.xyz/', '_blank');
        }}
        showLegalNotice={false}
      >
        <SigningRequestView />
      </Dialog>
    );
  }

  if (state.matches('incoming-transaction')) {
    return (
      <Dialog className="relative" showLegalNotice={false}>
        <TransactionRequestView />
      </Dialog>
    );
  }

  if (state.matches('incoming-authentication')) {
    return (
      <Dialog className="relative" showLegalNotice={false}>
        <ConnectAuthorizationView />
      </Dialog>
    );
  }

  /************************
   * GENERIC LOGIN STATES *
   ************************/
  if (
    state.matches('login-required.started') ||
    state.matches('login-required.deployment')
  ) {
    return (
      <Dialog className="relative" showLegalNotice={false}>
        <LoadingView message="Authenticating..." />
      </Dialog>
    );
  }

  /*************************
   * SPECIFIC LOGIN STATES *
   *************************/
  if (state.matches('login-required.waitForEmailOTP')) {
    return (
      <Dialog
        className="relative"
        onBack={() => {
          actorRef.send({ type: 'CANCEL' });
        }}
      >
        <WaitOtpView email={'TODO EMAIL'} />
      </Dialog>
    );
  }

  if (state.matches('login-required.selectEOAWallet')) {
    return (
      <Dialog
        className="relative"
        title="Select your wallet"
        onBack={() => {
          actorRef.send({ type: 'CANCEL' });
        }}
      >
        <SelectingWalletView />
      </Dialog>
    );
  }

  if (state.matches('wrong-network')) {
    return (
      <Dialog
        className="relative"
        title="Connect to Sophon"
        onClose={() => {
          disconnect();
          windowService.close();
        }}
        onBack={() => {
          disconnect();
          // goToNotAuthenticated();
        }}
      >
        <WrongNetworkView />
      </Dialog>
    );
  }

  /****************
   * FINAL STATES *
   ****************/
  if (state.matches('profile') && account) {
    const handleDisconnect = () => {
      sendMessage('smart-contract.logout', null);
    };

    return (
      <Dialog
        className="relative"
        onSettings={() => {
          window.parent.open('https://app.sophon.xyz/', '_blank');
        }}
        showLegalNotice={false}
        actions={<Button onClick={handleDisconnect}>Log out</Button>}
      >
        <LoginSuccessView />
      </Dialog>
    );
  }

  if (state.matches('completed')) {
    return (
      <Dialog className="relative" title="Ready!">
        <CompletedView />
      </Dialog>
    );
  }

  return (
    <Dialog className="relative">
      <NotAuthenticatedView />
    </Dialog>
  );
}
