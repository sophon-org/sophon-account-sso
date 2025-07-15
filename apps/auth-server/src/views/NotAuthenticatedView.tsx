import { FormEventHandler, useState } from "react";
import { useAccountCreate } from "@/hooks/useAccountCreate";
import { useAccountLogin } from "@/hooks/useAccountLogin";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { ProviderEnum } from "@dynamic-labs/types";
import {
  useAuthenticateConnectedUser,
  useConnectWithOtp,
  useDynamicContext,
  useSocialAccounts,
} from "@dynamic-labs/sdk-react-core";
import { Dialog } from "@/components/dialog";
import { LogoSophon } from "@/components/logos/logo-sophon";
import { IconGoogle } from "@/components/icons/icon-google";
import { IconTwitter } from "@/components/icons/icon-twitter";
import { IconDiscord } from "@/components/icons/icon-discord";
import { IconTelegram } from "@/components/icons/icon-telegram";
import { Loader } from "@/components/loader";
import { LegalNotice } from "@/components/legal";
import { useAccountContext } from "@/hooks/useAccountContext";
import { AccountStep } from "@/context/account-context";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const SOCIAL_PROVIDERS = {
  [ProviderEnum.Google]: {
    icon: <IconGoogle />,
    label: "Google",
  },
  [ProviderEnum.Twitter]: {
    icon: <IconTwitter />,
    label: "Twitter",
  },
  [ProviderEnum.Discord]: {
    icon: <IconDiscord />,
    label: "Discord",
  },
  [ProviderEnum.Telegram]: {
    icon: <IconTelegram />,
    label: "Telegram",
  },
};

export const NotAuthenticatedView = () => {
  const { authStep, setAuthStep } = useAccountContext();
  const [emailLoading, setEmailLoading] = useState(false);
  const [waitingOTP, setWaitingOTP] = useState(false);
  // const { authenticateUser, isAuthenticating } = useAuthenticateConnectedUser();
  // const { user, primaryWallet, authMode } = useDynamicContext();

  // console.log("🔥 user", user);
  // console.log("🔥 primaryWallet", primaryWallet);
  // console.log("🔥 authMode", authMode);

  const { connectWithEmail, verifyOneTimePassword } = useConnectWithOtp();
  const {
    error: errorSocial,
    isProcessing: isProcessingSocial,
    signInWithSocialAccount,
  } = useSocialAccounts();
  const [socialProvider, setSocialProvider] = useState<ProviderEnum>();

  const onSubmitEmailHandler: FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    try {
      setEmailLoading(true);
      event.preventDefault();
      const email = event.currentTarget.email.value;
      await connectWithEmail(email);
      setWaitingOTP(true);
    } finally {
      setEmailLoading(false);
    }
  };

  const onSubmitOtpHandler: FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    try {
      setEmailLoading(true);
      event.preventDefault();
      setAuthStep(AccountStep.AUTHENTICATING);
      const otp = event.currentTarget.otp.value;
      await verifyOneTimePassword(otp);
      //   if (!isAuthenticated) {
      //     // await authenticateUser();
      //   }
    } finally {
      setEmailLoading(false);
      setWaitingOTP(false);
    }
  };

  const { address, isConnected, connectWallet, disconnect, isPending } =
    useWalletConnection();

  const handleEOACreation = async () => {
    if (!isConnected) {
      await connectWallet();
    } else {
      await createAccount("eoa", address);
    }
  };

  const { createAccount, loading, error: createError } = useAccountCreate();

  const {
    loginToAccount,
    loading: loginLoading,
    error: loginError,
  } = useAccountLogin();
  return (
    <Dialog
      title="Sophon Auth"
      onClose={() => console.log("close")}
      onBack={() => console.log("back")}
      className="relative"
    >
      {!!authStep && authStep !== AccountStep.AUTHENTICATED && (
        <div className="text-center justify-items-center absolute top-0 left-0 right-0 bottom-0 bg-white/90 z-50 h-full w-full justify-center content-center flex flex-col gap-4">
          <div>
            <Loader className="w-4 h-4" />
          </div>
          <div className="text-xl">
            {authStep === AccountStep.AUTHENTICATING && "Authenticating..."}
            {authStep === AccountStep.CREATING_EMBEDDED_WALLET &&
              "Creating your social wallet..."}
            {authStep === AccountStep.DEPLOYING_ACCOUNT &&
              "Deploying your wallet... Almost there!"}
          </div>
        </div>
      )}

      <div className="text-center justify-items-center">
        <LogoSophon />
        <h2 className="text-xl font-bold text-gray-900 mt-4">Sign in</h2>
      </div>

      <div className="my-4">
        {errorSocial && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 text-sm">{errorSocial.message}</p>
          </div>
        )}
      </div>
      <div className="flex flex-row gap-2 my-4">
        {Object.entries(SOCIAL_PROVIDERS).map(([provider, { icon }]) => {
          const onClick = () => {
            setSocialProvider(provider as ProviderEnum);
            signInWithSocialAccount(provider as ProviderEnum);
          };
          return (
            <button
              key={provider}
              className="w-full py-3 px-4 bg-white text-black rounded-lg hover:bg-gray-200 pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed justify-items-center"
              onClick={onClick}
            >
              {socialProvider === provider && isProcessingSocial ? (
                <Loader className="w-4 h-4" />
              ) : (
                icon
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <form
          key="email-form"
          onSubmit={onSubmitEmailHandler}
          hidden={waitingOTP}
        >
          <input
            className="w-full bg-white border border-gray-300 rounded-md p-2 placeholder:text-gray-400 mb-2"
            type="email"
            name="email"
            placeholder="Email"
            required
          />
          <button
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
          >
            {emailLoading ? <Loader className="w-4 h-4" /> : "Continue"}
          </button>
        </form>

        <form key="otp-form" onSubmit={onSubmitOtpHandler} hidden={!waitingOTP}>
          <input
            className="w-full bg-white border border-gray-300 rounded-md p-2 placeholder:text-gray-400 mb-2"
            type="text"
            name="otp"
            placeholder="OTP"
            autoComplete="off"
          />
          <button
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
          >
            {emailLoading ? <Loader className="w-4 h-4" /> : "Verify"}
          </button>
        </form>
      </div>

      <div className="space-y-4 text-center pb-4">or</div>

      <div className="space-y-4">
        <div className="space-y-3">
          <button
            onClick={handleEOACreation}
            disabled={loading || isPending}
            className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader className="w-4 h-4" /> : "Connect With Metamask"}
          </button>
        </div>
      </div>

      {(createError || loginError) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600 text-sm">{createError || loginError}</p>
          <p className="text-xs text-gray-500 mt-1">
            💡 Tip: Make sure your device has Touch ID, Face ID, or a PIN set up
          </p>
        </div>
      )}

      {/* Sheet Example */}
      <div className="mt-4 text-center">
        <Sheet>
          <SheetTrigger asChild>
            <button className="text-sm text-blue-600 hover:text-blue-800 underline">
              More Options
            </button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Authentication Options</SheetTitle>
              <SheetDescription>
                Choose how you&apos;d like to sign in to your Sophon account
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Social Login</h3>
                <p className="text-sm text-gray-600">
                  Sign in quickly using your existing social media accounts
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Email</h3>
                <p className="text-sm text-gray-600">
                  Use your email address with OTP verification
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Wallet</h3>
                <p className="text-sm text-gray-600">
                  Connect your existing wallet like MetaMask
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <LegalNotice className="max-h-4" />
    </Dialog>
  );
};
