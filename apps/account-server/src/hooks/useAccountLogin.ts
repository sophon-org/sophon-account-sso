'use client';
import { useState } from 'react';
import { createPublicClient, http } from 'viem';
import { fetchAccount } from 'zksync-sso/client';
import { CONTRACTS, SOPHON_VIEM_CHAIN } from '@/lib/constants';
import { useAccountContext } from './useAccountContext';

export const useAccountLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accountData, setAccountData] = useState<{
    username: string;
    address: string;
    passkeyPublicKey: string;
  } | null>(null);

  const { login } = useAccountContext();

  const loginToAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: 'required',
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('No passkey credential provided');
      }

      const publicClient = createPublicClient({
        chain: SOPHON_VIEM_CHAIN,
        transport: http(),
      });

      // @ts-expect-error - fetchAccount type compatibility for testing
      const accountInfo = await fetchAccount(publicClient, {
        contracts: CONTRACTS,
        uniqueAccountId: credential.id,
      });

      const loginData = {
        username: accountInfo.username,
        address: accountInfo.address,
        passkeyPublicKey: accountInfo.passkeyPublicKey.toString(),
      };
      setAccountData(loginData);

      login({
        username: accountInfo.username,
        address: accountInfo.address,
        owner: {
          address: accountInfo.address,
          passkey: accountInfo.passkeyPublicKey,
        },
      });

      setSuccess(true);
    } catch (err: unknown) {
      console.error('Account login failed:', err);

      const errorMessage = 'Failed to login to account';

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loginToAccount,
    loading,
    error,
    success,
    accountData,
  };
};
