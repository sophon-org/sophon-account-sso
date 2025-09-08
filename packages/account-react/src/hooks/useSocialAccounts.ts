import { useState } from 'react';

export enum ProviderEnum {
  EmailOnly = 'emailOnly',
  Apple = 'apple',
  Discord = 'discord',
  Google = 'google',
  Twitter = 'twitter',
  Telegram = 'telegram',
}

/**
 * Hooks to handle requests related to Social link and unlink
 *
 * TODO: currently this is not supported and is here only for compatibility with previous version
 *
 * @returns a set of actions and states to handle social authentication
 */
export const useSocialAccounts = () => {
  const [isProcessing] = useState(false);
  const [error] = useState<{ message: string } | null>();
  const linkSocialAccount = (_provider: ProviderEnum) => {};
  const isLinked = (_provider: ProviderEnum) => {
    return false;
  };

  const getLinkedAccountInformation = (_provider: ProviderEnum) => {};

  return {
    isProcessing,
    isLinked,
    error,
    linkSocialAccount,
    getLinkedAccountInformation,
  };
};
