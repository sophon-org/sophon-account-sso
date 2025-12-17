import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useCallback } from 'react';
import type { Address, WalletClient } from 'viem';
import { toAccount } from 'viem/accounts';
import { useWalletClient } from 'wagmi';

type WalletSignTxParams = Parameters<WalletClient['signTransaction']>[0];
type WalletSignTypedDataParams = Parameters<WalletClient['signTypedData']>[0];

export const useCurrentClient = () => {
  const { primaryWallet } = useDynamicContext();
  const wagmiClient = useWalletClient();

  const getCurrentClient = useCallback(async (): Promise<
    WalletClient | undefined
  > => {
    if (primaryWallet && isEthereumWallet(primaryWallet)) {
      return await primaryWallet.getWalletClient();
    }

    return wagmiClient.data;
  }, [primaryWallet, wagmiClient]);

  const getCurrentLocalAccount = useCallback(async () => {
    const client = await getCurrentClient();

    if (!client || !client.account) {
      throw new Error('No client available to transform into local account');
    }

    return toAccount({
      address: client.account.address as Address,
      async signMessage({ message }) {
        const result = await client.signMessage({
          message,
          account: client.account!.address as Address,
        });
        if (!result) throw new Error('Failed to sign message on local account');
        return result;
      },
      async signTransaction(transaction) {
        const result = await client.signTransaction(
          transaction as WalletSignTxParams,
        );
        if (!result) throw new Error('Failed to sign transaction');
        return result;
      },
      async signTypedData(typedData) {
        const result = await client.signTypedData({
          ...typedData,
          account: client.account!.address as Address,
        } as WalletSignTypedDataParams);
        if (!result) throw new Error('Failed to sign typed data');
        return result;
      },
    });
  }, [getCurrentClient]);

  return {
    getCurrentClient,
    getCurrentLocalAccount,
  };
};
