import { AuthProvider } from '../hooks/use-embedded-auth';

export const AVAILABLE_PROVIDERS = [
  AuthProvider.APPLE,
  AuthProvider.GOOGLE,
  AuthProvider.TWITTER,
  AuthProvider.DISCORD,
  // TODO: enable telegram when dynamic labs supports it
  // AuthProvider.TELEGRAM,
];
