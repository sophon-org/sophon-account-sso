import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { headers } from 'next/headers';
import { cookieToInitialState } from 'wagmi';
import { getWagmiConfig } from '../../lib/wagmi';
import Web3Provider from '../../provider/Web3Provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(
    getWagmiConfig(),
    (await headers()).get('cookie'),
  );
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider initialState={initialState}>{children}</Web3Provider>
      </body>
    </html>
  );
}
