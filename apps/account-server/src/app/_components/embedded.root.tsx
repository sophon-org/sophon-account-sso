'use client';

import type { DataScopes } from '@sophon-labs/account-core';
import {
  sendMessageToRN,
  useRNHandler,
} from '@sophon-labs/account-message-bridge';
import { useCallback, useEffect, useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { logWithUser } from '@/debug/log';
import { env } from '@/env';
import { useEventHandler } from '@/events/hooks';
import { useAccountContext } from '@/hooks/useAccountContext';
import { usePostHogPartnerRegistration } from '@/hooks/usePostHogPartnerRegistration';
import { useRequestDrawer } from '@/hooks/useRequestDrawer';
import { useUserIdentification } from '@/hooks/useUserIdentification';
import { getSocialProviderFromURL } from '@/lib/social-provider';
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
  scopes: DataScopes[];
}

export default function EmbeddedRoot({ partnerId, scopes }: EmbeddedRootProps) {
  usePostHogPartnerRegistration(partnerId);
  const [open, setOpen] = useState(!!getSocialProviderFromURL());
  const state = MainStateMachineContext.useSelector((state) => state);
  const actorRef = MainStateMachineContext.useActorRef();
  const { openDrawer, DrawerComponent } = useRequestDrawer();
  const signingActions = SigningRequestView.useActions({ openDrawer });
  const transactionActions = TransactionRequestView.useActions({
    openDrawer,
  });
  const connectActions = ConnectAuthorizationView.useActions({ openDrawer });
  const { account } = useAccountContext();
  useUserIdentification();

  useEffect(() => {
    // Only enable this flow if the  flag is enabled, for some
    // really specific cases we should use this flow, mainly for local development
    if (env.NEXT_PUBLIC_EMBEDDED_FLOW_ENABLED) {
      const callback = (event: MessageEvent) => {
        if (
          event.origin === env.NEXT_PUBLIC_EMBEDDED_FLOW_ORIGIN &&
          event.data.type === 'embedded'
        ) {
          // @ts-ignore
          window.onMessageFromRN(event.data.payload);
        }
      };

      window.addEventListener('message', callback);
      return () => {
        window.removeEventListener('message', callback);
      };
    }
  }, []);

  useRNHandler(
    'openModal',
    useCallback(() => {
      setOpen(true);
      logWithUser('From RN > opened auth modal');
    }, []),
  );

  useRNHandler(
    'closeModal',
    useCallback(() => {
      setOpen(false);
      logWithUser('From RN > closed auth modal');
    }, []),
  );

  useRNHandler(
    'authSessionCancel',
    useCallback(() => {
      actorRef.send({ type: 'ACCOUNT_ERROR' });
      logWithUser('From RN > cancelled auth session');
    }, [actorRef]),
  );

  useRNHandler(
    'authSessionRedirect',
    useCallback((payload: { url: string }) => {
      logWithUser(`From RN > url redirection to ${payload.url}`);
      window.location.href = payload.url;
    }, []),
  );

  useRNHandler(
    'sdkStatusRequest',
    useCallback(() => {
      const payload = {
        isDrawerOpen: open,
        isReady: !state.context.isLoadingResources,
        isAuthenticated: state.context.isAuthenticated,
        connectedAccount: account?.address,
      };
      sendMessageToRN('sdkStatusResponse', payload);
      logWithUser(`From RN > sdk status request ${JSON.stringify(payload)}`);
    }, [state, open, account?.address]),
  );

  useEventHandler('flow.complete', () => {
    setOpen(false);
    logWithUser('flow complete');
  });

  useEventHandler('modal.open', () => {
    setOpen(true);
    logWithUser('modal open');
  });

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
        showHeader={false}
        showProfileImage={false}
        showLegalNotice={false}
        showLogo={false}
        drawerType="connection_authorization"
        actions={connectActions.renderActions()}
      >
        <ConnectAuthorizationView partnerId={partnerId} scopes={scopes} />
        <DrawerComponent />
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
