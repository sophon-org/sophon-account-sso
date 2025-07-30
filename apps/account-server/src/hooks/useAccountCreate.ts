'use client';
import { useState } from 'react';
import { createWalletClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { eip712WalletActions } from 'viem/zksync';
import { useWalletClient } from 'wagmi';
import { deployModularAccount } from 'zksync-sso/client';
import { registerNewPasskey } from 'zksync-sso/client/passkey';
import { CONTRACTS, VIEM_CHAIN } from '@/lib/constants';
import { deployAccount, getsSmartAccounts } from '@/service/account.service';
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
      try {
        setLoading(true);
        setError(null);

        const passkeyName = `Sophon Account ${new Date().toLocaleString()}`;

        const passkeyResult = await registerNewPasskey({
          userName: passkeyName,
          userDisplayName: passkeyName,
        });

        const ownerKey = generatePrivateKey();
        const ownerAccount = privateKeyToAccount(ownerKey);
        const ownerAddress = ownerAccount.address;

        const deployerClient = createWalletClient({
          account: ownerAccount,
          chain: VIEM_CHAIN,
          transport: http(),
        }).extend(eip712WalletActions());

        try {
          const deployedAccount = await deployModularAccount(deployerClient, {
            accountFactory: CONTRACTS.accountFactory as `0x${string}`,
            passkeyModule: {
              location: CONTRACTS.passkey as `0x${string}`,
              credentialId: passkeyResult.credentialId,
              credentialPublicKey: passkeyResult.credentialPublicKey,
            },
            paymaster: {
              location: CONTRACTS.accountPaymaster as `0x${string}`,
            },
            uniqueAccountId: passkeyResult.credentialId,
            sessionModule: {
              location: CONTRACTS.session as `0x${string}`,
              initialSession: undefined,
            },
            owners: [ownerAddress],
            installNoDataModules: [CONTRACTS.recovery as `0x${string}`],
          });

          setAccountAddress(deployedAccount.address);

          login({
            username: passkeyName,
            address: deployedAccount.address,
            owner: {
              address: ownerAddress,
              passkey: passkeyResult.credentialPublicKey,
            },
          });

          setSuccess(true);
        } catch (deployError: unknown) {
          console.error('deployModularAccount failed:', deployError);
          throw deployError;
        }
      } catch (err: unknown) {
        console.error('Account creation failed:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to create account',
        );
      } finally {
        setLoading(false);
      }
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
            owner: {
              address: connectedAddress as `0x${string}`,
              passkey: null,
              privateKey: null,
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
            owner: {
              address: smartAccountAddress,
              passkey: null,
              privateKey: null,
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
