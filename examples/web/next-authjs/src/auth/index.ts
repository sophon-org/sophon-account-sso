import NextAuth from 'next-auth';
import { AuthConfig } from './config';

export const { auth, handlers, signIn, signOut, unstable_update } = NextAuth({
  pages: {
    newUser: '/',
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
  },
  debug: true,
  ...AuthConfig,
});
