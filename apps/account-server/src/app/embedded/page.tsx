'use client';

import { useRNHandler } from '@sophon-labs/account-message-bridge';
import { useCallback, useEffect, useState } from 'react';
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { sendMessage } from '@/events';
import { useEventHandler } from '@/events/hooks';
import { useConnectionAuthorization } from '@/hooks/auth/useConnectionAuthorization';
import { useAccountContext } from '@/hooks/useAccountContext';
import { serverLog } from '@/lib/server-log';
import { CompletedView } from '@/views/CompletedView';
import ConnectAuthorizationView from '@/views/ConnectAuthorizationView';
import { LoadingView } from '@/views/LoadingView';
import { NotAuthenticatedView } from '@/views/NotAuthenticatedView';
import SelectingWalletView from '@/views/SelectingWalletView';
import SigningRequestView from '@/views/SigningRequestView';
import TransactionRequestView from '@/views/TransactionRequestView';
import WaitOtpView from '@/views/WaitOtpView';
import WrongNetworkView from '@/views/WrongNetworkView';

export default function RootPage() {
  const [open, setOpen] = useState(false);
  const state = MainStateMachineContext.useSelector((state) => state);
  const actorRef = MainStateMachineContext.useActorRef();
  const { onRefuseConnection, onAcceptConnection, isLoading } =
    useConnectionAuthorization();

  useEffect(() => {
    serverLog(JSON.stringify(state));
  }, [state]);

  useRNHandler(
    'openModal',
    useCallback(() => {
      setOpen(true);
    }, []),
  );

  useEventHandler('flow.complete', () => {
    setOpen(false);
  });

  useEventHandler('modal.open', () => {
    setOpen(true);
  });

  useEffect(() => {
    serverLog(`&&&& CURRENT STATE: ${JSON.stringify(state.value)}`);
    serverLog(`&&&& CURRENT CONTEXT: ${JSON.stringify(state.context)}`);
  }, [state]);

  const { account } = useAccountContext();

  const handleCloseModal = (isOpen: boolean) => {
    serverLog(`❤️ closing: ${isOpen}`);
    setOpen(isOpen);
    if (!isOpen) {
      actorRef.send({ type: 'CANCEL' });
    }
  };

  // const handleCloseModal = useCallback(
  //   (isOpen: boolean) => {
  //     actorRef.send({ type: 'CANCEL' });
  //     setOpen(isOpen);
  //   },
  //   [actorRef],
  // );

  /***************************
   * LOADING RESOURCES STATE *
   ***************************/
  if (state.matches('loading')) {
    return (
      <Drawer
        open={open}
        onOpenChange={handleCloseModal}
        showHeader={false}
        showLogo={false}
        showLegalNotice={false}
      >
        <LoadingView message="Loading..." />
      </Drawer>
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
      <Drawer
        open={open}
        onOpenChange={handleCloseModal}
        showHeader={false}
        showLogo={false}
        showLegalNotice={false}
      >
        <SigningRequestView />
      </Drawer>
    );
  }

  if (state.matches('incoming-transaction')) {
    return (
      <Drawer
        open={open}
        onOpenChange={handleCloseModal}
        showHeader={false}
        showLogo={false}
        showLegalNotice={false}
      >
        <TransactionRequestView />
      </Drawer>
    );
  }

  if (state.matches('incoming-authentication')) {
    return (
      <Drawer
        open={open}
        onOpenChange={handleCloseModal}
        showHeader={true}
        showProfileImage={true}
        showLegalNotice={false}
        showLogo={false}
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
      >
        <ConnectAuthorizationView />
      </Drawer>
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
      <Drawer
        open={open}
        onOpenChange={handleCloseModal}
        showHeader={true}
        title="Authenticating"
        showLogo={false}
        showLegalNotice={false}
      >
        <LoadingView />
      </Drawer>
    );
  }

  /*************************
   * SPECIFIC LOGIN STATES *
   *************************/
  if (state.matches('login-required.waitForEmailOTP')) {
    return (
      <Drawer
        open={open}
        onOpenChange={handleCloseModal}
        showHeader={true}
        title="Insert 6-digit code"
        showLogo={true}
        showLegalNotice={false}
      >
        <WaitOtpView />
      </Drawer>
    );
  }

  if (state.matches('login-required.selectEOAWallet')) {
    return (
      <Drawer
        open={open}
        onOpenChange={handleCloseModal}
        showHeader={false}
        showLogo={false}
        showLegalNotice={false}
      >
        <SelectingWalletView />
      </Drawer>
    );
  }

  if (state.matches('wrong-network')) {
    return (
      <Drawer
        open={open}
        onOpenChange={handleCloseModal}
        showHeader={false}
        showLogo={false}
        showLegalNotice={false}
      >
        <WrongNetworkView />
      </Drawer>
    );
  }

  /****************
   * FINAL STATES *
   ****************/
  if (state.matches('profile') && account) {
    const handleDisconnect = () => {
      sendMessage('smart-contract.logout', null);
      actorRef.send({ type: 'CANCEL' });
    };

    return (
      <Drawer
        open={open}
        onOpenChange={handleCloseModal}
        actions={<Button onClick={handleDisconnect}>Log out</Button>}
        showHeader={true}
        showProfileImage={true}
        showLegalNotice={false}
        showLogo={false}
        title="falleco.soph.id"
        // onSettings={() => {
        //   // goToSettings();
        // }}
      />
    );
  }

  if (state.matches('completed')) {
    return (
      <Drawer
        open={open}
        onOpenChange={handleCloseModal}
        showHeader={false}
        showLogo={false}
        showLegalNotice={false}
      >
        <CompletedView />
      </Drawer>
    );
  }

  // TODO: settings state
  // if (authState === AuthState.SETTINGS) {
  //   return (
  //     <Drawer
  //       open={open}
  //       onOpenChange={(open) => {
  //         setOpen(open);
  //         if (!open) {
  //           windowService.close();
  //         }
  //       }}
  //       showHeader={true}
  //       showLegalNotice={false}
  //       showLogo={false}
  //       title="Settings"
  //       actions={
  //         <div className="flex flex-col gap-2 w-full items-center">
  //           <p className="text-lg">Manage your account at Sophon Home</p>
  //           <Button
  //             onClick={() => {
  //               window.parent.open('https://app.sophon.xyz/', '_blank');
  //             }}
  //           >
  //             Open Sophon
  //           </Button>
  //         </div>
  //       }
  //       onBack={() => {
  //         goToAuthenticated();
  //       }}
  //     />
  //   );
  // }

  return (
    <Drawer open={open} onOpenChange={handleCloseModal} showHeader={false}>
      <NotAuthenticatedView />
    </Drawer>
  );
}
