import { ProviderEnum } from '@dynamic-labs/types';
import { type FormEventHandler, useState } from 'react';
import { IconDiscord } from '@/components/icons/icon-discord';
import { IconGoogle } from '@/components/icons/icon-google';
import { IconTelegram } from '@/components/icons/icon-telegram';
import { IconTwitter } from '@/components/icons/icon-twitter';
import { Loader } from '@/components/loader';
import { LogoSophon } from '@/components/logos/logo-sophon';
import { Button } from '@/components/ui/button';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAuthCallbacks } from '@/hooks/auth/useAuthActions';
import { useAccountCreate } from '@/hooks/useAccountCreate';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { trackAuthMethodSelected, trackAuthStarted } from '@/lib/analytics';
import { windowService } from '@/service/window.service';

const SOCIAL_PROVIDERS = {
  [ProviderEnum.Google]: {
    icon: IconGoogle,
    label: 'Google',
  },
  [ProviderEnum.Twitter]: {
    icon: IconTwitter,
    label: 'Twitter',
  },
  [ProviderEnum.Discord]: {
    icon: IconDiscord,
    label: 'Discord',
  },
  [ProviderEnum.Telegram]: {
    icon: IconTelegram,
    label: 'Telegram',
  },
};

interface NotAuthenticatedViewProps {
  onSelectWallet?: () => void;
  onEmailAuth?: (email: string) => Promise<void>;
  onSocialAuth: (provider: ProviderEnum) => Promise<void>;
}

// Props type for both Mobile and Web views
interface ViewProps extends NotAuthenticatedViewProps {
  emailLoading: boolean;
  onSubmitEmailHandler: FormEventHandler<HTMLFormElement>;
  socialProvider?: ProviderEnum;
  loading: boolean;
  isPending: boolean;
  error?: string | null;
}

const MobileView = ({
  emailLoading,
  onSubmitEmailHandler,
  socialProvider,
  onSocialAuth,
  error,
}: ViewProps) => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-6 justify-center items-center mt-12 mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
      </div>

      <div className="flex flex-col gap-6 px-6">
        <div className="flex flex-row gap-2">
          {Object.entries(SOCIAL_PROVIDERS).map(
            ([provider, { icon: Icon }]) => (
              <button
                type="button"
                key={provider}
                className="p-2 h-16 w-full bg-white text-black rounded-2xl border border-[rgba(15, 14, 13, 0.08)] hover:bg-gray-100 transition-all duration-300 cursor-pointer pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed justify-items-center"
                onClick={() => onSocialAuth(provider as ProviderEnum)}
              >
                {socialProvider === provider ? (
                  <Loader className="w-4 h-4 border-white border-r-transparent" />
                ) : (
                  <div className="flex items-center justify-center">
                    <Icon />
                  </div>
                )}
              </button>
            ),
          )}
        </div>
        <div className="space-y-4">
          <form key="email-form" onSubmit={onSubmitEmailHandler}>
            <input
              className="w-full h-14 p-3 bg-white border border-[#EBE9E6] rounded-md placeholder:text-[#CCCAC8] placeholder:text-lg mb-2"
              type="email"
              name="email"
              placeholder="Enter email"
              required
            />
            <Button variant="primary" type="submit" disabled={emailLoading}>
              {emailLoading ? (
                <Loader className="w-4 h-4 border-white border-r-transparent" />
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 text-sm">{error}</p>
            <p className="text-xs text-gray-500 mt-1">
              💡 Tip: Make sure your device has Touch ID, Face ID, or a PIN set
              up
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const WebView = ({
  emailLoading,
  onSubmitEmailHandler,
  socialProvider,
  onSocialAuth,
  loading,
  isPending,
  onSelectWallet,
  error,
}: ViewProps) => {
  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-6 justify-center items-center">
        <LogoSophon />
        <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
      </div>

      <div className="flex flex-col gap-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 text-sm">{error}</p>
            {/* <p className="text-xs text-gray-500 mt-1">
              💡 Tip: Make sure your device has Touch ID, Face ID, or a PIN set
              up
            </p> */}
          </div>
        )}
        <div className="flex flex-row gap-2">
          {Object.entries(SOCIAL_PROVIDERS).map(
            ([provider, { icon: Icon }]) => (
              <button
                type="button"
                key={provider}
                className="p-4 h-16 w-full bg-white text-black rounded-2xl border border-[rgba(15, 14, 13, 0.08)] hover:bg-gray-100 transition-all duration-300 cursor-pointer pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
                onClick={() => onSocialAuth(provider as ProviderEnum)}
              >
                {socialProvider === provider ? (
                  <Loader className="w-4 h-4 border-white border-r-transparent" />
                ) : (
                  <Icon />
                )}
              </button>
            ),
          )}
        </div>
        <div className="space-y-4">
          <form key="email-form" onSubmit={onSubmitEmailHandler}>
            <input
              className="w-full h-14 p-3 bg-white border border-[#EBE9E6] rounded-md placeholder:text-[#CCCAC8] placeholder:text-lg mb-2"
              type="email"
              name="email"
              placeholder="Enter email"
              required
            />
            <Button variant="primary" type="submit" disabled={emailLoading}>
              {emailLoading ? (
                <Loader className="w-4 h-4 border-white border-r-transparent" />
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </div>

        <div className="flex flex-row gap-4 justify-between items-center">
          <div className="h-px w-full bg-[#0F0E0D] opacity-10" />
          <div className="text-center">or</div>
          <div className="h-px w-full bg-[#0F0E0D] opacity-10" />
        </div>

        <div className="mt-2">
          <Button
            variant="secondary"
            type="button"
            onClick={onSelectWallet}
            disabled={loading || isPending}
          >
            {loading ? (
              <Loader className="w-4 h-4 border-white border-r-transparent" />
            ) : (
              'Continue with Wallet'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const NotAuthenticatedView = () => {
  const actorRef = MainStateMachineContext.useActorRef();
  const { requestOTP, connectSocial } = useAuthCallbacks();
  const [error, setError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const isMobile = windowService.name === 'webview';

  const [socialProvider, setSocialProvider] = useState<ProviderEnum>();

  const onSelectWallet = () => {
    trackAuthMethodSelected('wallet');
    actorRef.send({ type: 'WALLET_SELECTION' });
  };

  const onSubmitEmailHandler: FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    try {
      setEmailLoading(true);
      event.preventDefault();
      const email = event.currentTarget.email.value;

      trackAuthMethodSelected('email');
      trackAuthStarted('email');
      await requestOTP(email);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSocialAuth = async (provider: ProviderEnum) => {
    setSocialProvider(provider);
    try {
      trackAuthMethodSelected('social', provider);
      trackAuthStarted('social', provider);
      await connectSocial(provider);
    } catch (error) {
      setError(error as string);
    }
  };

  const { isPending } = useWalletConnection();
  const { loading, error: createError } = useAccountCreate();
  const genericError = MainStateMachineContext.useSelector(
    (state) => state.context.error,
  );

  const sharedProps = {
    emailLoading,
    onSubmitEmailHandler,
    socialProvider,
    onSocialAuth: handleSocialAuth,
    loading,
    isPending,
    onSelectWallet,
    error: error ?? createError ?? genericError,
  };

  return isMobile ? (
    <MobileView {...sharedProps} />
  ) : (
    <WebView {...sharedProps} />
  );
};
