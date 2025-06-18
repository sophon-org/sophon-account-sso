"use client";
import { useState } from "react";
import { useAccountCreate } from "@/hooks/useAccountCreate";
import { useAccountLogin } from "@/hooks/useAccountLogin";

export default function AuthPage() {
  const [mode, setMode] = useState<"create" | "login">("create");

  const {
    createAccount,
    loading: createLoading,
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

  // Success states
  if (createSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600">
              Account Created!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your Sophon account is ready
            </p>

            <div className="mt-4 p-3 bg-gray-50 rounded border">
              <p className="text-xs text-gray-500">Account Address:</p>
              <p className="text-sm font-mono break-all text-green-600">
                {accountAddress}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  // Send account data to parent window
                  if (window.opener) {
                    window.opener.postMessage(
                      {
                        type: "SOPHON_ACCOUNT_CREATED",
                        data: {
                          address: accountAddress,
                          mode: "create",
                          timestamp: new Date().toISOString(),
                        },
                      },
                      "*"
                    );
                    window.close();
                  } else {
                    window.location.reload();
                  }
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Use This Account
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Login Instead
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loginSuccess && accountData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600">
              Login Successful!
            </h2>

            <div className="mt-4 p-3 bg-gray-50 rounded border">
              <p className="text-xs text-gray-500">Account Address:</p>
              <p className="text-sm font-mono break-all text-green-600">
                {accountData.address}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  // Send login data to parent window
                  if (window.opener && accountData) {
                    window.opener.postMessage(
                      {
                        type: "SOPHON_ACCOUNT_LOGIN",
                        data: {
                          address: accountData.address,
                          username: accountData.username,
                          passkeyPublicKey: accountData.passkeyPublicKey,
                          mode: "login",
                          timestamp: new Date().toISOString(),
                        },
                      },
                      "*"
                    );
                    window.close();
                  } else {
                    window.location.reload();
                  }
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Use This Account
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sophon Auth</h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === "create"
              ? "Create your account"
              : "Login to your existing account"}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode("create")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === "create"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            Login
          </button>
        </div>

        {mode === "create" ? (
          <button
            onClick={createAccount}
            disabled={createLoading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createLoading ? "Creating Account..." : "Create Account"}
          </button>
        ) : (
          <button
            onClick={loginToAccount}
            disabled={loginLoading}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginLoading ? "Logging In..." : "Login with Passkey"}
          </button>
        )}

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
