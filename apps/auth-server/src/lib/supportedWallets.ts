export interface SupportedWallet {
  name: string;
  icon: string;
  downloadUrl: string;
}

export const SUPPORTED_WALLETS: SupportedWallet[] = [
  {
    name: "MetaMask",
    icon: "/images/supported-wallets/metamask.png",
    downloadUrl: "https://metamask.io/en-GB/download",
  },
  {
    name: "Keplr",
    icon: "/images/supported-wallets/keplr.png",
    downloadUrl: "https://www.keplr.app/",
  },
  {
    name: "Phantom",
    icon: "/images/supported-wallets/phantom.png",
    downloadUrl: "https://phantom.com/",
  },
  {
    name: "Rabby",
    icon: "/images/supported-wallets/rabby.webp",
    downloadUrl: "https://rabby.io/",
  },
];
