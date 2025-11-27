import type { Address } from 'viem';
import { toAccount } from 'viem/accounts';
import type { WalletClient } from 'wagmi';

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
      // @ts-expect-error - Type mismatch between viem account interface and wallet client
      const result = await walletClient.signTransaction(transaction);
      if (!result) throw new Error('Failed to sign transaction');
      return result;
    },
    async signTypedData(typedData) {
      // @ts-expect-error - Type mismatch between viem account interface and wallet client
      const result = await walletClient.signTypedData({
        ...typedData,
        account: walletClient.account!.address as Address,
      });
      if (!result) throw new Error('Failed to sign typed data');
      return result;
    },
  });
};

export const createWalletAccount = (
  address: Address,
  walletClient?: WalletClient | null,
) =>
  toAccount({
    address,
    async signMessage({ message }) {
      const signature = await walletClient?.signMessage({
        message,
      });
      if (!signature) throw new Error('Failed to sign message');
      return signature;
    },
    async signTransaction(transaction) {
      const signature = await walletClient?.signTransaction(
        // @ts-expect-error - Type mismatch between viem account interface and wallet client
        transaction,
      );
      if (!signature) throw new Error('Failed to sign transaction');
      return signature;
    },
    async signTypedData(typedData) {
      const signature = await walletClient?.signTypedData(
        // @ts-expect-error - Type mismatch between viem account interface and wallet client
        typedData,
      );
      if (!signature) throw new Error('Failed to sign typed data');
      return signature;
    },
  });
