// auth-config.ts
import type { AuthProvider } from '../hooks/use-embedded-auth';
import { AVAILABLE_PROVIDERS } from './providers';

export type LoginOptionType = 'wallet' | 'email' | 'socials';

export type LoginOption = {
  type: LoginOptionType;
  socialPriority?: AuthProvider[];
};

export interface AuthFlowConfig {
  highlight: LoginOption[];
  showMore?: LoginOption[];
}

export const DEFAULT_AUTH_CONFIG: AuthFlowConfig = {
  highlight: [
    {
      type: 'socials',
      socialPriority: AVAILABLE_PROVIDERS,
    },
    { type: 'email' },
    { type: 'wallet' },
  ],
  showMore: [],
};
