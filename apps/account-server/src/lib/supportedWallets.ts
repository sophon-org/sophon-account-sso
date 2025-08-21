export interface SupportedWallet {
  name: string;
  icon?: string;
  downloadUrl?: string;
}

export const SUPPORTED_WALLETS: SupportedWallet[] = [
  {
    name: 'WalletConnect',
    icon: '/images/supported-wallets/wallet-connect.png',
    downloadUrl: 'https://reown.com/',
  },
  {
    name: 'MetaMask',
    icon: '/images/supported-wallets/metamask.png',
    downloadUrl: 'https://metamask.io/en-GB/download',
  },
  {
    name: 'Rabby',
    icon: '/images/supported-wallets/rabby.webp',
    downloadUrl: 'https://rabby.io/',
  },
  {
    name: 'Safe',
    icon: '/images/supported-wallets/safe.webp',
    downloadUrl: 'https://safe.global/',
  },
  {
    name: 'Zerion',
    icon: '/images/supported-wallets/zerion.webp',
    downloadUrl: 'https://zerion.io/',
  },
  {
    name: 'OKX',
    icon: '/images/supported-wallets/okx.webp',
    downloadUrl: 'https://www.okx.com/download',
  },
  {
    name: 'SubWallet',
    icon: '/images/supported-wallets/subwallet.webp',
    downloadUrl: 'https://www.subwallet.app/',
  },
];
