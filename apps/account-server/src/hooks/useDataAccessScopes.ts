import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import type { DataScopes } from '@sophon-labs/account-core';
import { useEffect, useState } from 'react';
import { AllScopes, type Scopes } from '@/types/data-scopes';

export const useDataAccessScopes = (requestedScopes: DataScopes[]) => {
  const { user } = useDynamicContext();
  const [userScopes, setUserScopes] = useState<Scopes[]>([]);

  useEffect(() => {
    if (user) {
      const contextScopes: Scopes[] = [];

      // Collect all OAuth emails first
      const oauthEmails = new Set<string>();
      user.verifiedCredentials.forEach((cred) => {
        if (cred.oauthEmails?.length) {
          cred.oauthEmails.forEach((email) => oauthEmails.add(email));
        }
      });

      // Only add 'email' scope if user.email is not covered by OAuth
      if (user.email && !oauthEmails.has(user.email)) {
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
        if (cred.oauthProvider === 'apple') {
          contextScopes.push('apple');
        }
      });
      setUserScopes([
        ...contextScopes.filter((scope) =>
          requestedScopes.includes(scope as DataScopes),
        ),
      ]);
    }
  }, [user, requestedScopes]);

  return {
    userScopes,
    availableScopes: AllScopes,
  };
};
