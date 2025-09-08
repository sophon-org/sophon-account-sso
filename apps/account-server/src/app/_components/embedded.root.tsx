'use client';

import { useRNHandler } from '@sophon-labs/account-message-bridge';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { sendMessage } from '@/events';
import { useEventHandler } from '@/events/hooks';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useRequestDrawer } from '@/hooks/useRequestDrawer';
import { useUserIdentification } from '@/hooks/useUserIdentification';
import { serverLog } from '@/lib/server-log';
import { CompletedView } from '@/views/CompletedView';
import ConnectAuthorizationView from '@/views/ConnectAuthorizationView';
import { LoadingView } from '@/views/LoadingView';
import { LogoutView } from '@/views/LogoutView';
import { NotAuthenticatedView } from '@/views/NotAuthenticatedView';
import SelectingWalletView from '@/views/SelectingWalletView';
import SigningRequestView from '@/views/SigningRequestView';
import TransactionRequestView from '@/views/TransactionRequestView';
import WaitOtpView from '@/views/WaitOtpView';
import WrongNetworkView from '@/views/WrongNetworkView';

interface EmbeddedRootProps {
  partnerId?: string;
}

export default function EmbeddedRoot({ partnerId }: EmbeddedRootProps) {
  const [open, setOpen] = useState(false);
  const state = MainStateMachineContext.useSelector((state) => state);
  const actorRef = MainStateMachineContext.useActorRef();
  const { openDrawer, DrawerComponent } = useRequestDrawer();
  const signingActions = SigningRequestView.useActions({ openDrawer });
  const transactionActions = TransactionRequestView.useActions({
    openDrawer,
  });
  const connectActions = ConnectAuthorizationView.useActions();
  useUserIdentification();

  useEffect(() => {
    const callback = (event: MessageEvent) => {
      if (
        event.origin === 'http://localhost:3006' &&
        event.data.type === 'embedded'
      ) {
        console.log('Processing Embedded Message', event.data.payload);
        // @ts-ignore
        window.onMessageFromRN(event.data.payload);
      }
    };

    window.addEventListener('message', callback);
    return () => {
      window.removeEventListener('message', callback);
    };
  }, []);

  useRNHandler(
    'openModal',
    useCallback(() => {
      setOpen(true);
    }, []),
  );

  useRNHandler(
    'closeModal',
    useCallback(() => {
      setOpen(false);
    }, []),
  );

  useEffect(() => {
    serverLog(`>>> 🔥 <<< STATE ${JSON.stringify(state, null, 2)}`);
  }, [state]);

  useEventHandler('flow.complete', () => {
    setOpen(false);
  });

  useEventHandler('modal.open', () => {
    setOpen(true);
  });

  const { account } = useAccountContext();

  const handleCloseModal = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      actorRef.send({ type: 'CANCEL' });
    }
  };

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
        drawerType="loading"
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
      <>
        <Drawer
          open={open}
          onOpenChange={handleCloseModal}
          showHeader={true}
          showProfileImage={true}
          title={account?.address}
          showLogo={false}
          showLegalNotice={false}
          drawerType="signing_request"
          actions={signingActions.renderActions()}
        >
          <SigningRequestView openDrawer={openDrawer} />
        </Drawer>
        <DrawerComponent />
      </>
    );
  }

  if (state.matches('incoming-transaction')) {
    return (
      <>
        <Drawer
          open={open}
          onOpenChange={handleCloseModal}
          showHeader={true}
          showProfileImage={true}
          title={account?.address}
          showLogo={false}
          showLegalNotice={false}
          drawerType="transaction_request"
          actions={transactionActions.renderActions()}
        >
          <TransactionRequestView openDrawer={openDrawer} />
        </Drawer>
        <DrawerComponent />
      </>
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
        drawerType="connection_authorization"
        actions={connectActions.renderActions()}
      >
        <ConnectAuthorizationView partnerId={partnerId} />
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
        drawerType="authenticating"
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
        drawerType="otp_verification"
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
        drawerType="wallet_selection"
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
        drawerType="wrong_network"
      >
        <WrongNetworkView />
      </Drawer>
    );
  }

  /****************
   * FINAL STATES *
   ****************/
  if (state.matches('incoming-logout')) {
    return (
      <Drawer
        open={open}
        onOpenChange={() => {}}
        showHeader={true}
        showProfileImage={true}
        showLegalNotice={false}
        showLogo={true}
        drawerType="incomming_logout"
      >
        <LogoutView />
      </Drawer>
    );
  }

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
        title={account.address}
        drawerType="user_profile"
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
        drawerType="completed"
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
    <Drawer
      open={open}
      onOpenChange={handleCloseModal}
      showHeader={false}
      drawerType="authentication"
    >
      <NotAuthenticatedView />
    </Drawer>
  );
}
