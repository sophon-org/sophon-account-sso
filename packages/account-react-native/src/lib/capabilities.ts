export enum Capabilities {
  /**
   * Allows users to authenticate using EOA wallets like Metamask, WalletConnect, etc.
   */
  WALLET_CONNECT = 'wallet_connect',

  /**
   * Displays a modal to the user to authorize the application to access their data.
   * This allows to gather more data information than the one user is
   */
  AUTHORIZATION_MODAL = 'authorization_modal',
}
