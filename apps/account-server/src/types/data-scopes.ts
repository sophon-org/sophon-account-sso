import { DataScopes } from '@sophon-labs/account-core';

export const AllScopes = {
  email: {
    label: 'Email',
    key: DataScopes.email,
    description: 'Your email address',
  },
  google: {
    label: 'Google',
    key: DataScopes.google,
    description: 'Your Google account handle',
  },
  discord: {
    label: 'Discord',
    key: DataScopes.discord,
    description: 'Your Discord account handle',
  },
  telegram: {
    label: 'Telegram',
    key: DataScopes.telegram,
    description: 'Your Telegram account handle',
  },
  x: {
    label: 'X (Twitter)',
    key: DataScopes.x,
    description: 'Your X (Twitter) account handle',
  },
};

export type Scopes = keyof typeof AllScopes;
