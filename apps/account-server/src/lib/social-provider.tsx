import {
  DiscordIcon,
  GoogleIcon,
  TelegramIcon,
  TwitterIcon,
} from '@dynamic-labs/iconic';
import type { ProviderEnum } from '@dynamic-labs/types';

const SOCIAL_PROVIDER_KEY = 'socialProvider';

export function setSocialProviderInURL(provider: ProviderEnum): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.set(SOCIAL_PROVIDER_KEY, provider);
  window.history.replaceState({}, '', url.toString());
}

export function getSocialProviderFromURL(): ProviderEnum | null {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);
  return url.searchParams.get(SOCIAL_PROVIDER_KEY) as ProviderEnum;
}

export function clearSocialProviderFromURL(): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.delete(SOCIAL_PROVIDER_KEY);
  window.history.replaceState({}, '', url.toString());
}

// Icon utilities
export function getSocialProviderIcon(
  provider: ProviderEnum,
  className = 'w-14 h-14',
) {
  switch (provider) {
    case 'google':
      return <GoogleIcon className={className} />;
    case 'twitter':
      return <TwitterIcon className={className} />;
    case 'telegram':
      return <TelegramIcon className={className} />;
    case 'discord':
      return <DiscordIcon className={className} />;
    default:
      return null;
  }
}
