export interface WalletOption {
  id: string;
  name: string;
  deepLink: string;
  universalLink?: string;
  icon: string;
  appStoreUrl: string;
}

export const SUPPORTED_WALLETS: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    deepLink: 'metamask://wc',
    // universalLink: 'https://metamask.app.link/wc',
    icon: '🦊',
    appStoreUrl: 'https://apps.apple.com/app/metamask/id1438144202',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    deepLink: 'cbwallet://wc',
    icon: '🔵',
    appStoreUrl: 'https://apps.apple.com/app/coinbase-wallet/id1278383455',
  },
  {
    id: 'uniswap',
    name: 'Uniswap Wallet',
    deepLink: 'uniswap://wc',
    // universalLink: 'https://wallet.uniswap.org/wc', // Common WalletConnect universal link format for Uniswap
    icon: '🦄',
    appStoreUrl:
      'https://apps.apple.com/app/uniswap-crypto-nft-wallet/id6443944476',
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    deepLink: 'trust://wc',
    // universalLink: 'https://link.trustwallet.com/wc',
    icon: '🛡️',
    appStoreUrl:
      'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    deepLink: 'rainbow://wc',
    // universalLink: 'https://rnbwapp.com/wc',
    icon: '🌈',
    appStoreUrl:
      'https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021',
  },
  {
    id: 'binance',
    name: 'Binance Wallet',
    deepLink: 'bnc://app.binance.com/wc',
    // universalLink: 'https://app.binance.com/wc',
    icon: '🟡',
    appStoreUrl:
      'https://apps.apple.com/app/binance-buy-bitcoin-crypto/id1436799971',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    deepLink: 'phantom://wc',
    // universalLink: 'https://phantom.app/ul/v1/wc',
    icon: '👻',
    appStoreUrl:
      'https://apps.apple.com/app/phantom-solana-wallet/id1598432977',
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    deepLink: 'okx://main/wc',
    icon: '⭕',
    appStoreUrl:
      'https://apps.apple.com/app/okx-buy-bitcoin-btc-crypto/id1327268470',
  },
  {
    id: 'zerion',
    name: 'Zerion',
    deepLink: 'zerion://wc',
    icon: '⚡',
    appStoreUrl:
      'https://apps.apple.com/app/zerion-wallet-ethereum/id1456732565',
  },
  {
    id: 'argent',
    name: 'Argent',
    deepLink: 'argent://wc',
    icon: '🏛️',
    appStoreUrl: 'https://apps.apple.com/app/argent/id1358741926',
  },
  {
    id: 'imtoken',
    name: 'imToken',
    deepLink: 'imtokenv2://wc',
    icon: '💎',
    appStoreUrl:
      'https://apps.apple.com/app/imtoken-crypto-wallet/id1384798940',
  },
];
