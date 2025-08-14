export const AllScopes = {
  email: {
    label: 'Email',
    key: 'email',
    description: 'Your email address',
  },
  google: {
    label: 'Google',
    key: 'google',
    description: 'Your Google account handle',
  },
  discord: {
    label: 'Discord',
    key: 'discord',
    description: 'Your Discord account handle',
  },
  telegram: {
    label: 'Telegram',
    key: 'telegram',
    description: 'Your Telegram account handle',
  },
  x: {
    label: 'X (Twitter)',
    key: 'x',
    description: 'Your X (Twitter) account handle',
  },
};

export type Scopes = keyof typeof AllScopes;
