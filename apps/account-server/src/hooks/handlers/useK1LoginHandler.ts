'use client';

import { MainStateMachineContext } from '@/context/state-machine-context';
import { useEventHandler } from '@/events/hooks';
import { useAccountContext } from '@/hooks/useAccountContext';
import { deployAccount } from '@/service/account.service';
import { getsSmartAccounts } from '@/service/smart-account.server';

/**
 * Handles every login request from k1, being possible right now
 * - email
 * - eoa wallet
 * - embedded wallet
 * Passkeys should be handled on other event handler
 */
export const useK1LoginHandler = () => {
  const actorRef = MainStateMachineContext.useActorRef();
  const { login } = useAccountContext();

  useEventHandler('k1.login', async (payload) => {
    if (!payload.address) {
      return;
    }

    actorRef.send({ type: 'ACCOUNT_AUTHENTICATED' });
    const accounts = await getsSmartAccounts(payload.address);

    let smartAccountAddress: `0x${string}`;
    if (accounts.length === 0) {
      const response = await deployAccount(payload.address);
      smartAccountAddress = response.accounts[0];
    } else {
      smartAccountAddress = accounts[0];
    }

    await login(
      {
        address: smartAccountAddress,
        username: 'k1',
        owner: {
          address: payload.address,
          passkey: null,
          privateKey: null,
        },
      },
      payload.wallet,
    );

    actorRef.send({ type: 'LOGIN_SUCCESS' });
  });
};
