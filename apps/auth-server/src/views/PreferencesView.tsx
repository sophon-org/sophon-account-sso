import { useAccountContext } from "@/hooks/useAccountContext";
import { sendMessageToRN } from "@sophon-labs/account-message-bridge/dist/src/web";

const sendMessageToNative = (message: string) => {
  sendMessageToRN("echo", { message });
};

export default function PreferencesView({
  onUseAccount,
}: {
  onUseAccount: () => void;
}) {
  const { account, logout } = useAccountContext();
  const externallyOpened = !!window.opener || !!window.ReactNativeWebView;

  return (
    <div className="text-center">
      <div className="mt-4 p-3 bg-gray-50 rounded border">
        <p className="text-xs text-gray-500">Account Address:</p>
        <p className="text-sm font-mono break-all text-green-600">
          {account?.address}
        </p>
        <p className="text-xs text-gray-500">Owner Address:</p>
        <p className="text-sm font-mono break-all text-orange-600">
          {account?.owner.address}
        </p>
      </div>

      {!!externallyOpened && (
        <div className="mt-4 space-y-2">
          <button
            onClick={onUseAccount}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Use This Account
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <button
          onClick={() => sendMessageToNative("Hello form web server!")}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Hello Webview
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={logout}
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
