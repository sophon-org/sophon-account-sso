'use client';

import { MainStateMachineContext } from '@/context/state-machine-context';
import { useEventHandler } from '@/events/hooks';
import { useAccountContext } from '@/hooks/useAccountContext';
import { deployAccount, getsSmartAccounts } from '@/service/account.service';
import { useAuthResponse } from '../useAuthResponse';

/**
 * Handles every login request from k1, being possible right now
 * - email
 * - eoa wallet
 * - embedded wallet
 * Passkeys should be handled on other event handler
 */
export const useK1LoginHandler = () => {
  const actorRef = MainStateMachineContext.useActorRef();
  const { handleAuthSuccessResponse } = useAuthResponse();
  const { login } = useAccountContext();
  const { incoming, session, transaction, signing } =
    MainStateMachineContext.useSelector((state) => state.context.requests);

  useEventHandler('k1.login', async (payload) => {
    actorRef.send({ type: 'ACCOUNT_AUTHENTICATED' });
    const accounts = await getsSmartAccounts(payload.address);

    let smartAccountAddress: `0x${string}`;
    if (accounts.length === 0) {
      const response = await deployAccount(payload.address);
      smartAccountAddress = response.accounts[0] as `0x${string}`;
    } else {
      smartAccountAddress = accounts[0] as `0x${string}`;
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

    if (incoming && !transaction && !signing) {
      handleAuthSuccessResponse(
        { address: smartAccountAddress },
        incoming!,
        session,
      );
    }

    actorRef.send({ type: 'LOGIN_SUCCESS' });
  });
};
