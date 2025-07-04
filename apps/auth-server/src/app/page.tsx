"use client";
import { useAccountCreate } from "@/hooks/useAccountCreate";
import { useAccountLogin } from "@/hooks/useAccountLogin";
import { useAuthResponse } from "@/hooks/useAuthResponse";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import SigningRequestView from "@/views/SigningRequestView";
import TransactionRequestView from "@/views/TransactionRequestView";
import CreateSuccessView from "@/views/CreateSuccessView";
import LoginSuccessView from "@/views/LoginSuccessView";
// import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { NotAuthenticatedView } from "@/views/NotAuthenticatedView";
import PreferencesView from "@/views/PreferencesView";
import { useAccountContext } from "@/hooks/useAccountContext";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Loader } from "@/components/loader";
import { useRNHandler } from "@sophon-labs/account-message-bridge";

export default function RootPage() {
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
            window.ReactNativeWebView.postMessage("Hello, React Native!");
          }
        }}
      />
    );
  }

  return <NotAuthenticatedView />;
}
