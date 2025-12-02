import type { Address, WalletClient } from 'viem';
import { toAccount } from 'viem/accounts';

type WalletSignTxParams = Parameters<WalletClient['signTransaction']>[0];
type WalletSignTypedDataParams = Parameters<WalletClient['signTypedData']>[0];

export const createPrimaryWalletAccount = async (primaryWallet: {
  getWalletClient: () => Promise<WalletClient | null>;
}) => {
  const walletClient = await primaryWallet.getWalletClient();
  if (!walletClient?.account?.address) {
    throw new Error('Wallet client missing account address');
  }

  return toAccount({
    address: walletClient.account.address as Address,
    async signMessage({ message }) {
      const result = await walletClient.signMessage({
        message,
        account: walletClient.account!.address as Address,
      });
      if (!result) throw new Error('Failed to sign message');
      return result;
    },
    async signTransaction(transaction) {
      const result = await walletClient.signTransaction(
        transaction as WalletSignTxParams,
      );
      if (!result) throw new Error('Failed to sign transaction');
      return result;
    },
    async signTypedData(typedData) {
      const result = await walletClient.signTypedData({
        ...typedData,
        account: walletClient.account!.address as Address,
      } as WalletSignTypedDataParams);
      if (!result) throw new Error('Failed to sign typed data');
      return result;
    },
  });
};

export const createWalletAccount = (
  address: Address,
  walletClient: WalletClient,
) =>
  toAccount({
    address,
    async signMessage({ message }) {
      const signature = await walletClient?.signMessage({
        message,
        account: address as Address,
      });
      if (!signature) throw new Error('Failed to sign message');
      return signature;
    },
    async signTransaction(transaction) {
      const signature = await walletClient?.signTransaction(
        transaction as WalletSignTxParams,
      );
      if (!signature) throw new Error('Failed to sign transaction');
      return signature;
    },
    async signTypedData(typedData) {
      const signature = await walletClient?.signTypedData({
        ...typedData,
        account: address,
      } as WalletSignTypedDataParams);
      if (!signature) throw new Error('Failed to sign typed data');
      return signature;
    },
  });
