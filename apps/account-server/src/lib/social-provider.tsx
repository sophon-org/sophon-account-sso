import {
  AppleIcon,
  DiscordIcon,
  GoogleIcon,
  TwitterIcon,
} from '@dynamic-labs/iconic';
import type { OAuthProvider } from '@openfort/react';

const SOCIAL_PROVIDER_KEY = 'socialProvider';

export function setSocialProviderInURL(provider: OAuthProvider): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.set(SOCIAL_PROVIDER_KEY, provider);
  window.history.replaceState({}, '', url.toString());
}

export function getSocialProviderFromURL(): OAuthProvider | null {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);
  return url.searchParams.get(SOCIAL_PROVIDER_KEY) as OAuthProvider;
}

export function clearSocialProviderFromURL(): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.delete(SOCIAL_PROVIDER_KEY);
  window.history.replaceState({}, '', url.toString());
}

// Icon utilities
export function getSocialProviderIcon(
  provider: OAuthProvider,
  className = 'w-10 h-10',
) {
  switch (provider) {
    case 'google':
      return <GoogleIcon className={className} />;
    case 'twitter':
      return <TwitterIcon className={className} />;
    // TODO: open fort doesnt support telegram
    // case 'telegram':
    //   return <TelegramIcon className={className} />;
    case 'discord':
      return <DiscordIcon className={className} />;
    case 'apple':
      return <AppleIcon className={className} />;
    default:
      return null;
  }
}
