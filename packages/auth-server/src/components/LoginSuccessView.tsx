import type { LoginSuccessProps } from "@/types/auth";

export default function LoginSuccessView({
  accountData,
  sessionPreferences,
  onUseAccount,
}: LoginSuccessProps) {
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
              onClick={onUseAccount}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {sessionPreferences ? "Login with Session" : "Use This Account"}
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
