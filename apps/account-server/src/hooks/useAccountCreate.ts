'use client';
import { useState } from 'react';
import { createWalletClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { eip712WalletActions } from 'viem/zksync';
import { useWalletClient } from 'wagmi';
import { deployModularAccount } from 'zksync-sso/client';
import { registerNewPasskey } from 'zksync-sso/client/passkey';
import { CONTRACTS, SOPHON_VIEM_CHAIN } from '@/lib/constants';
import { deployAccount, getsSmartAccounts } from '@/service/account.service';
import { AccountType } from '@/types/smart-account';
import { useAccountContext } from './useAccountContext';

export const useAccountCreate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accountAddress, setAccountAddress] = useState<string>('');

  const { login } = useAccountContext();
  const { data: walletClient } = useWalletClient();

  const createAccount = async (
    accountType: 'passkey' | 'eoa',
    connectedAddress?: string,
  ) => {
    if (accountType === 'passkey') {
      throw new Error('Passkey account creation are not supported yet');
    } else {
      try {
        setLoading(true);
        setError(null);

        if (!connectedAddress) {
          throw new Error(
            'No wallet connected. Please connect your wallet first.',
          );
        }

        if (!walletClient) {
          throw new Error(
            'Wallet client not available. Please ensure your wallet is connected.',
          );
        }

        const accounts = await getsSmartAccounts(
          connectedAddress as `0x${string}`,
        );
        if (accounts.length > 0) {
          login({
            username: `EOA Account ${connectedAddress.slice(0, 8)}...`,
            address: accounts[0],
            signer: {
              address: connectedAddress as `0x${string}`,
              accountType: AccountType.EOA,
            },
          });
          setAccountAddress(accounts[0]);
          setSuccess(true);
          return;
        } else {
          const { accounts } = await deployAccount(
            connectedAddress as `0x${string}`,
          );
          const smartAccountAddress = accounts[0] as `0x${string}`;
          setAccountAddress(smartAccountAddress);
          login({
            username: `EOA Account ${connectedAddress!.slice(0, 8)}...`,
            address: smartAccountAddress,
            signer: {
              address: smartAccountAddress,
              accountType: AccountType.EOA,
            },
          });
          setSuccess(true);
        }
      } catch (checkError) {
        console.error('❌ Account check failed:', checkError);
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    createAccount,
    loading,
    error,
    success,
    accountAddress,
  };
};
