'use client';

import { AuthService, type ChainId } from '@sophon-labs/account-core';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useEventHandler } from '@/events/hooks';
import { useAccountContext } from '@/hooks/useAccountContext';
import { SOPHON_VIEM_CHAIN } from '@/lib/constants';
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
  const { login, setSmartAccountDeployed } = useAccountContext();

  useEventHandler('k1.login', async (payload) => {
    if (!payload.address) {
      return;
    }

    actorRef.send({ type: 'ACCOUNT_AUTHENTICATED' });
    const accounts = await getsSmartAccounts(payload.address);

    let smartAccountAddress: `0x${string}`;
    if (accounts.length === 0) {
      const response = await AuthService.deploySmartAccount(
        SOPHON_VIEM_CHAIN.id as ChainId,
        payload.address,
      );
      smartAccountAddress = response.contracts[0];
    } else {
      smartAccountAddress = accounts[0];
    }

    setSmartAccountDeployed(true);

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
