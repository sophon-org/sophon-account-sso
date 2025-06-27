"use client";
import { FormEventHandler, useEffect, useState } from "react";
import { useAccountCreate } from "@/hooks/useAccountCreate";
import { useAccountLogin } from "@/hooks/useAccountLogin";
import { useAccountStore } from "@/hooks/useAccountState";
import { useAuthResponse } from "@/hooks/useAuthResponse";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import SigningRequestView from "@/components/SigningRequestView";
import TransactionRequestView from "@/components/TransactionRequestView";
import CreateSuccessView from "@/components/CreateSuccessView";
import LoginSuccessView from "@/components/LoginSuccessView";
import {
  useConnectWithOtp,
  useDynamicContext,
} from "@dynamic-labs/sdk-react-core";

export default function AuthPage() {
  const [accountType, setAccountType] = useState<"passkey" | "eoa">("eoa");
  const { user, primaryWallet } = useDynamicContext();
  const { connectWithEmail, verifyOneTimePassword } = useConnectWithOtp();

  const onSubmitEmailHandler: FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    const email = event.currentTarget.email.value;

    await connectWithEmail(email);
  };

  const onSubmitOtpHandler: FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    const otp = event.currentTarget.otp.value;

    await verifyOneTimePassword(otp);
  };

  const {
    incomingRequest,
    sessionPreferences,
    signingRequest,
    transactionRequest,
  } = useMessageHandler();

  const accountStore = useAccountStore();
  const { handleAuthSuccessResponse } = useAuthResponse();
  const { address, isConnected, connectWallet, disconnect, isPending } =
    useWalletConnection();

  const handleEOACreation = async () => {
    if (!isConnected) {
      await connectWallet();
    } else {
      await createAccount("eoa", address);
    }
  };

  const {
    createAccount,
    loading,
    error: createError,
    success: createSuccess,
    accountAddress,
  } = useAccountCreate();

  const {
    loginToAccount,
    loading: loginLoading,
    error: loginError,
    success: loginSuccess,
    accountData,
  } = useAccountLogin();

  useEffect(() => {
    if (
      user &&
      primaryWallet &&
      incomingRequest &&
      !signingRequest &&
      !transactionRequest
    ) {
      console.log("🔥 Dynamic user authenticated, sending success response!");

      handleAuthSuccessResponse(
        { address: primaryWallet.address },
        incomingRequest,
        sessionPreferences
      );

      // Close the popup after a short delay
      /* setTimeout(() => {
        window.close();
      }, 500); */
    }
  }, [
    user,
    primaryWallet,
    incomingRequest,
    signingRequest,
    transactionRequest,
    sessionPreferences,
    handleAuthSuccessResponse,
  ]);

  if (signingRequest && incomingRequest) {
    return (
      <SigningRequestView
        signingRequest={signingRequest}
        accountStore={accountStore}
        incomingRequest={incomingRequest}
      />
    );
  }

  if (transactionRequest && incomingRequest) {
    return (
      <TransactionRequestView
        transactionRequest={transactionRequest}
        accountStore={accountStore}
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sophon Auth</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create or login to your account
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setAccountType("eoa");
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                accountType === "eoa"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              🔑 EOA Wallet
            </button>
            <button
              onClick={() => {
                setAccountType("passkey");
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                accountType === "passkey"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              🔐 Passkey
            </button>
          </div>
          {accountType === "passkey" ? (
            <>
              <button
                onClick={() => createAccount("passkey")}
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "Create Passkey Account"}
              </button>
              <button
                onClick={loginToAccount}
                disabled={loginLoading}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? "Logging In..." : "Login with Passkey"}
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleEOACreation}
                disabled={loading || isPending}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Setting up account..."
                  : isPending
                  ? "Connecting wallet..."
                  : !isConnected
                  ? "Connect EOA Account"
                  : "Complete Account Setup"}
              </button>

              {isConnected && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-600 text-sm font-medium">
                    Wallet Connected
                  </p>
                  <p className="text-green-500 text-xs">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                  <button
                    onClick={() => disconnect()}
                    className="text-red-500 text-xs hover:underline mt-1"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="space-y-4">
            <form key="email-form" onSubmit={onSubmitEmailHandler}>
              <input
                className="w-full bg-white border border-gray-300 rounded-md p-2 placeholder:text-gray-400 mb-2"
                type="email"
                name="email"
                placeholder="Email"
              />
              <button
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              >
                Submit
              </button>
            </form>

            <form key="otp-form" onSubmit={onSubmitOtpHandler}>
              <input
                className="w-full bg-white border border-gray-300 rounded-md p-2 placeholder:text-gray-400 mb-2"
                type="text"
                name="otp"
                placeholder="OTP"
              />
              <button
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              >
                Submit
              </button>
            </form>

            {!!primaryWallet && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-medium text-blue-800">
                  🔗 Dynamic Wallet Connected
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  <strong>Address:</strong> {primaryWallet.address}
                </p>
                <p className="text-xs text-blue-600">
                  <strong>Connector:</strong>{" "}
                  {primaryWallet.connector?.name || "Unknown"}
                </p>
                <p className="text-xs text-blue-600">
                  <strong>Chain:</strong> {primaryWallet.chain || "Unknown"}
                </p>
              </div>
            )}
          </div>
        </div>

        {(createError || loginError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 text-sm">{createError || loginError}</p>
            <p className="text-xs text-gray-500 mt-1">
              💡 Tip: Make sure your device has Touch ID, Face ID, or a PIN set
              up
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
