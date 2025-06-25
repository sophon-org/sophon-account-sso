import { useAccount } from "wagmi";

import type { CreateSuccessProps } from "@/types/auth";

export default function CreateSuccessView({
  accountAddress,
  sessionPreferences,
  onUseAccount,
}: CreateSuccessProps) {
  const { address: connectedAddress } = useAccount();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <p className="mt-2 text-sm text-gray-600">
            Your Sophon account is ready
          </p>

          <div className="mt-4 p-3 bg-gray-50 rounded border">
            <p className="text-xs text-gray-500">Account Address:</p>
            <p className="text-sm font-mono break-all text-green-600">
              {accountAddress}
            </p>
          </div>

          {connectedAddress && (
            <div className="mt-4 p-3 bg-blue-50 rounded border">
              <p className="text-xs text-gray-500">Connected Wallet:</p>
              <p className="text-sm font-mono break-all text-blue-600">
                {connectedAddress}
              </p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <button
              onClick={onUseAccount}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {sessionPreferences
                ? "Create Account with Session"
                : "Use This Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
