'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

export default function Providers({
  children,
  session,
}: Readonly<{
  children: React.ReactNode;
  session?: Session | null;
}>) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
