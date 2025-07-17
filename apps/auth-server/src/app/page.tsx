"use client";

import React from "react";
import { useAuthResponse } from "@/hooks/useAuthResponse";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import SigningRequestView from "@/views/SigningRequestView";
import TransactionRequestView from "@/views/TransactionRequestView";
import CreateSuccessView from "@/views/CreateSuccessView";
import LoginSuccessView from "@/views/LoginSuccessView";
import { NotAuthenticatedView } from "@/views/NotAuthenticatedView";
import { useAccountContext } from "@/hooks/useAccountContext";
import { Loader } from "@/components/loader";
import { useAuthState, AuthState } from "@/hooks/useAuthState";
import { useRNHandler } from "@sophon-labs/account-message-bridge/dist/src/web";
import { Dialog } from "@/components/dialog";
import { windowService } from "@/service/window.service";

export default function RootPage() {
  const {
    state: authState,
    context,
    goToNotAuthenticated,
    startWalletConnection,
    startEmailAuthentication,
    verifyOTP,
    startSocialAuthentication,
    startSigningRequest,
    startTransactionRequest,
  } = useAuthState();

  const { incomingRequest, sessionPreferences } = useMessageHandler({
    onSigningRequest: startSigningRequest,
    onTransactionRequest: startTransactionRequest,
  });

  useRNHandler("echo", (payload) => {
    console.log("🔥 Received message from React Native:", payload);
    alert(payload.message);
  });

  const { account, logout } = useAccountContext();
  const { handleAuthSuccessResponse } = useAuthResponse();

  console.log("auth State", authState);

  if (authState === AuthState.LOADING) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader className="h-10 w-10 animate-spin block" />
        <br />
        <p className="ml-2">Loading SDK...</p>
      </div>
    );
  }

  if (authState === AuthState.SIGNING_REQUEST) {
    return (
      <Dialog className="relative">
        <SigningRequestView
          signingRequest={context.signingRequest!}
          account={account!}
          incomingRequest={incomingRequest!}
        />
      </Dialog>
    );
  }

  if (authState === AuthState.TRANSACTION_REQUEST) {
    return (
      <TransactionRequestView
        transactionRequest={context.transactionRequest!}
        account={account!}
        incomingRequest={incomingRequest!}
      />
    );
  }

  if (authState === AuthState.CREATING_ACCOUNT) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader className="h-10 w-10 animate-spin block" />
        <br />
        <p className="text-black ml-2">
          {context.email ? "Verifying code..." : "Authenticating..."}
        </p>
      </div>
    );
  }

  if (authState === AuthState.WAITING_OTP) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Check your email</h2>
          <p className="text-gray-600 mb-6">
            We sent a verification code to {context.email}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const otp = formData.get("otp") as string;
              await verifyOTP(otp);
            }}
            className="space-y-4"
          >
            <input
              className="w-full bg-white border border-gray-300 rounded-md p-2 placeholder:text-gray-400 text-center"
              type="text"
              name="otp"
              placeholder="Enter verification code"
              required
            />
            <button
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              type="submit"
            >
              Verify
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (authState === AuthState.AUTHENTICATED && account) {
    const handleDisconnect = () => {
      logout();
      goToNotAuthenticated();
    };

    return (
      <Dialog className="relative">
        <LoginSuccessView
          accountData={account}
          sessionPreferences={sessionPreferences}
          onUseAccount={async () => {
            await handleAuthSuccessResponse(
              { address: account.address },
              incomingRequest!,
              sessionPreferences
            );
            windowService.close();
          }}
          onDisconnect={handleDisconnect}
        />
      </Dialog>
    );
  }

  if (authState === AuthState.SUCCESS && account) {
    const handleDisconnect = () => {
      logout();
      goToNotAuthenticated();
    };

    return (
      <Dialog className="relative">
        <CreateSuccessView
          accountAddress={account.address}
          sessionPreferences={sessionPreferences}
          onUseAccount={async () => {
            await handleAuthSuccessResponse(
              { address: account.address },
              incomingRequest!,
              sessionPreferences
            );
            windowService.close();
          }}
          onDisconnect={handleDisconnect}
        />
      </Dialog>
    );
  }

  if (account) {
    return (
      <Dialog className="relative">
        <PreferencesView
          onUseAccount={async () => {
            await handleAuthSuccessResponse(
              { address: account.address },
              incomingRequest!,
              sessionPreferences
            );

            windowService.close();
          }}
        />
      </Dialog>
    );
  }

  if (authState === AuthState.ERROR) {
    return (
      <Dialog className="relative">
        <div className="flex h-screen w-screen items-center justify-center flex-col">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold mb-2">Error!</h1>
            <p className="text-gray-600 mb-4">
              {context.error || "Something went wrong"}
            </p>
            <button
              onClick={goToNotAuthenticated}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog className="relative">
      <NotAuthenticatedView
        onConnectWallet={startWalletConnection}
        onEmailAuth={startEmailAuthentication}
        onSocialAuth={startSocialAuthentication}
      />
    </Dialog>
  );
}
