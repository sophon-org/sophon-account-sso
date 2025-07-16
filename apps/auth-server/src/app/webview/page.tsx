"use client";

import { useAccountCreate } from "@/hooks/useAccountCreate";
import { useAccountLogin } from "@/hooks/useAccountLogin";
import { useAuthResponse } from "@/hooks/useAuthResponse";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import SigningRequestView from "@/views/SigningRequestView";
import TransactionRequestView from "@/views/TransactionRequestView";
import CreateSuccessView from "@/views/CreateSuccessView";
import LoginSuccessView from "@/views/LoginSuccessView";
import { NotAuthenticatedView } from "@/views/NotAuthenticatedView";
import PreferencesView from "@/views/PreferencesView";
import { useAccountContext } from "@/hooks/useAccountContext";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Loader } from "@/components/loader";
import {
  sendMessageToRN,
  useRNHandler,
} from "@sophon-labs/account-message-bridge/dist/src/web";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

export default function RootPage() {
  const [open, setOpen] = useState(true);
  const { sdkHasLoaded } = useDynamicContext();
  const {
    incomingRequest,
    sessionPreferences,
    signingRequest,
    transactionRequest,
  } = useMessageHandler();

  useRNHandler("echo", (payload) => {
    console.log("🔥 Received message from React Native:", payload);
    alert(payload.message);
  });

  useRNHandler("openModal", () => {
    setOpen(true);
  });

  const { account } = useAccountContext();
  const { handleAuthSuccessResponse } = useAuthResponse();
  const { success: createSuccess, accountAddress } = useAccountCreate();
  const { success: loginSuccess, accountData } = useAccountLogin();

  // useEffect(() => {
  //   if (
  //     user &&
  //     primaryWallet &&
  //     incomingRequest &&
  //     !signingRequest &&
  //     !transactionRequest
  //   ) {
  //     console.log("🔥 Dynamic user authenticated, sending success response!");

  //     handleAuthSuccessResponse(
  //       { address: primaryWallet.address },
  //       incomingRequest,
  //       sessionPreferences
  //     );

  //     // Close the popup after a short delay
  //     /* setTimeout(() => {
  //       window.close();
  //     }, 500); */
  //   }
  // }, [
  //   user,
  //   primaryWallet,
  //   incomingRequest,
  //   signingRequest,
  //   transactionRequest,
  //   sessionPreferences,
  //   handleAuthSuccessResponse,
  // ]);

  if (!sdkHasLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader className="h-10 w-10 animate-spin block" />
        <br />
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  if (account && signingRequest && incomingRequest) {
    return (
      <SigningRequestView
        signingRequest={signingRequest}
        account={account}
        incomingRequest={incomingRequest}
      />
    );
  }

  if (account && transactionRequest && incomingRequest) {
    return (
      <TransactionRequestView
        transactionRequest={transactionRequest}
        account={account}
        incomingRequest={incomingRequest}
      />
    );
  }

  if (createSuccess) {
    return (
      <CreateSuccessView
        accountAddress={accountAddress}
        sessionPreferences={sessionPreferences}
        onUseAccount={async () => {
          await handleAuthSuccessResponse(
            { address: accountAddress },
            incomingRequest!,
            sessionPreferences
          );
          window.close();
        }}
      />
    );
  }

  if (loginSuccess && accountData) {
    return (
      <LoginSuccessView
        accountData={accountData}
        sessionPreferences={sessionPreferences}
        onUseAccount={async () => {
          await handleAuthSuccessResponse(
            { address: accountData.address },
            incomingRequest!,
            sessionPreferences
          );
          window.close();
        }}
      />
    );
  }

  if (account) {
    return (
      <Sheet
        open={open}
        modal={true}
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) {
            sendMessageToRN("closeModal", {});
          }
        }}
      >
        <SheetContent side="bottom" className="rounded-t-3xl pb-8 px-4">
          <SheetHeader hidden={true}>
            <SheetTitle>Sophon Preferences Modal</SheetTitle>
          </SheetHeader>
          <PreferencesView
            onUseAccount={async () => {
              await handleAuthSuccessResponse(
                { address: account.address },
                incomingRequest!,
                sessionPreferences
              );
              if (window.opener) {
                window.close();
              } else if (window.ReactNativeWebView) {
                sendMessageToRN("connected", { address: account.address });
              }
            }}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet
      open={open}
      modal={true}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          sendMessageToRN("closeModal", {});
        }
      }}
    >
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader hidden={true}>
          <SheetTitle>Sophon Authentication Modal</SheetTitle>
        </SheetHeader>
        <NotAuthenticatedView />
      </SheetContent>
    </Sheet>
  );
}
