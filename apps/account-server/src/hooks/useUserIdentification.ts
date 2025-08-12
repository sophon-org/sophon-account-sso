import { useEffect, useRef } from 'react';
import { useAccountContext } from '@/hooks/useAccountContext';
import { identifyUser, updateUserProperties } from '@/lib/analytics';
import { AccountType, type SmartAccount } from '@/types/smart-account';

/**
 * Hook to handle user identification with PostHog
 * Automatically identifies users when account becomes available
 */
export const useUserIdentification = () => {
  const { account } = useAccountContext();
  const hasIdentifiedRef = useRef(false);

  useEffect(() => {
    if (!account?.address || hasIdentifiedRef.current) return;

    // Identify the user with their smart contract address
    identifyUser(account.address, {
      username: account.username,
      authMethod: getAuthMethodFromAccount(account),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    });

    hasIdentifiedRef.current = true;
  }, [account]);

  // Update user properties when account changes
  useEffect(() => {
    if (!account?.address) return;

    updateUserProperties({
      last_seen: new Date().toISOString(),
      username: account.username,
      account_type: 'smart_contract',
    });
  }, [account?.username, account?.address]);

  return {
    isIdentified: !!account?.address,
    userAddress: account?.address,
  };
};

// Helper to determine auth method from account context
const getAuthMethodFromAccount = (
  account: SmartAccount,
): 'wallet' | 'passkey' | 'social' => {
  if (account.owner.accountType === AccountType.Passkey) return 'passkey';
  if (account.owner.accountType === AccountType.EMBEDDED) return 'social';
  return 'wallet'; // fallback
};
