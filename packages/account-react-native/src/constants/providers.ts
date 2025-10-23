import { AuthProvider } from '../hooks/use-embedded-auth';

export const AVAILABLE_PROVIDERS = [
  AuthProvider.APPLE,
  AuthProvider.GOOGLE,
  AuthProvider.TWITTER,
  AuthProvider.DISCORD,
  AuthProvider.TELEGRAM,
];
