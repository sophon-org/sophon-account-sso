import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useEffect, useState } from 'react';
import { AllScopes, type Scopes } from '@/types/data-scopes';

export const useDataAccessScopes = () => {
  const { user } = useDynamicContext();
  const [userScopes, setUserScopes] = useState<Scopes[]>([]);

  useEffect(() => {
    if (user) {
      const contextScopes: Scopes[] = [];
      if (user.email) {
        contextScopes.push('email');
      }
      user.verifiedCredentials.forEach((cred) => {
        if (cred.oauthProvider === 'google') {
          contextScopes.push('google');
        }
        if (cred.oauthProvider === 'discord') {
          contextScopes.push('discord');
        }
        if (cred.oauthProvider === 'telegram') {
          contextScopes.push('telegram');
        }
        if (cred.oauthProvider === 'twitter') {
          contextScopes.push('x');
        }
      });
      setUserScopes([...contextScopes]);
    }
  }, [user]);

  return {
    userScopes,
    availableScopes: AllScopes,
  };
};
