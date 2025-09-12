import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { headers } from 'next/headers';
import { sophonTestnet } from 'viem/chains';
import { cookieToInitialState } from 'wagmi';
import { AccountContextProvider } from '@/context/account-context';
import { MainStateMachineContextProvider } from '@/context/state-machine-context';
import { env } from '@/env';
import DefaultLayout from '@/layouts/default';
import { GenericEventProvider } from '@/providers/GerericEventProvider';
import { Web3Provider } from '@/providers/Web3Provider';
import { getWagmiConfig } from '@/providers/wagmi';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const isTestnet = env.NEXT_PUBLIC_CHAIN_ID === sophonTestnet.id;
  const networkName = isTestnet ? 'Testnet' : 'Mainnet';

  return {
    title: `Sophon Account - Auth Server (${networkName})`,
    description: `Sophon Account authentication server for ${networkName}`,
    icons: {
      icon: isTestnet ? '/favicon-testnet.svg' : '/favicon-mainnet.svg',
      shortcut: isTestnet ? '/favicon-testnet.svg' : '/favicon-mainnet.svg',
      apple: isTestnet ? '/favicon-testnet.svg' : '/favicon-mainnet.svg',
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const availableHeaders = await headers();
  const initialState = cookieToInitialState(
    getWagmiConfig(),
    availableHeaders.get('cookie'),
  );

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AccountContextProvider>
          <MainStateMachineContextProvider>
            <Web3Provider initialState={initialState}>
              <GenericEventProvider />
              <DefaultLayout>{children}</DefaultLayout>
            </Web3Provider>
          </MainStateMachineContextProvider>
        </AccountContextProvider>
      </body>
    </html>
  );
}
