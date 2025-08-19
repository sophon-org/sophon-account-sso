'use client';

import { shortenAddress } from '@sophon-labs/account-core';

import { Dialog } from '@/components/dialog';
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { sendMessage } from '@/events';
import { useConnectionAuthorization } from '@/hooks/auth/useConnectionAuthorization';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useUserIdentification } from '@/hooks/useUserIdentification';
import { useWalletConnection } from '@/hooks/useWalletConnection';
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
  const { onRefuseConnection, onAcceptConnection, isLoading } =
    useConnectionAuthorization();
  useUserIdentification();

  /***************************
   * LOADING RESOURCES STATE *
   ***************************/
  if (state.matches('loading')) {
    return (
      <Dialog className="relative" showLegalNotice={false} dialogType="loading">
        <LoadingView message="Loading..." />
      </Dialog>
    );
  }

  /***************************
   * INCOMING REQUESTS STATE *
   ***************************/
  if (
    state.matches('incoming-typed-data-signature') ||
    state.matches('incoming-message-signature')
  ) {
    return (
      <Dialog
        className="relative"
        title={shortenAddress(account?.address)}
        showSettings={true}
        showLegalNotice={false}
        dialogType="signing_request"
      >
        <SigningRequestView />
      </Dialog>
    );
  }

  if (state.matches('incoming-transaction')) {
    return (
      <Dialog
        className="relative"
        showLegalNotice={false}
        dialogType="transaction_request"
      >
        <TransactionRequestView />
      </Dialog>
    );
  }

  if (state.matches('incoming-authentication')) {
    return (
      <Dialog
        className="relative"
        dialogType="connection_authorization"
        actions={
          <div className="flex items-center justify-center gap-2 w-full">
            <Button
              variant="transparent"
              disabled={isLoading}
              onClick={onRefuseConnection}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              onClick={onAcceptConnection}
            >
              {isLoading ? (
                <Loader className="w-4 h-4 border-white border-r-transparent" />
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        }
        showLegalNotice={false}
      >
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
      <Dialog
        className="relative"
        showLegalNotice={false}
        dialogType="authenticating"
      >
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
        title="Insert 6-digit code"
        dialogType="otp_verification"
        onBack={() => {
          actorRef.send({ type: 'CANCEL' });
        }}
      >
        <WaitOtpView />
      </Dialog>
    );
  }

  if (state.matches('login-required.selectEOAWallet')) {
    const isWalletConnectActive = state.context.isWalletConnectActive;
    return (
      <Dialog
        className="relative"
        title={isWalletConnectActive ? 'WalletConnect' : 'Select your wallet'}
        dialogType="wallet_selection"
        onBack={() => {
          if (isWalletConnectActive) {
            actorRef.send({ type: 'WALLET_CONNECT_CANCELLED' });
          } else {
            actorRef.send({ type: 'CANCEL' });
          }
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
        dialogType="wrong_network"
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
        showSettings={true}
        showLegalNotice={false}
        dialogType="user_profile"
        actions={<Button onClick={handleDisconnect}>Log out</Button>}
      >
        <LoginSuccessView />
      </Dialog>
    );
  }

  if (state.matches('completed')) {
    return (
      <Dialog className="relative" title="Ready!" dialogType="completed">
        <CompletedView />
      </Dialog>
    );
  }

  return (
    <Dialog className="relative" dialogType="authentication">
      <NotAuthenticatedView />
    </Dialog>
  );
}
