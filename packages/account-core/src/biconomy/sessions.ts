import {
  type ActionData,
  type EnableSessionData,
  getDefaultMEENetworkUrl,
  getDefaultMeeGasTank,
  type Instruction,
  type Signer,
} from '@biconomy/abstractjs';
import type { Address } from 'viem';
import { type ChainId, IsStagingChain, SophonChains } from '../constants';
import { buildBiconomySessionClient } from './client';

export { getSudoPolicy } from '@biconomy/abstractjs';

export type SessionAction = ActionData;

type GrantMeePermissionResponseEntry = {
  permissionId: `0x${string}`;
  mode: `0x${string}`;
  signature: `0x${string}`;
  enableSessionData: EnableSessionData;
};

type GrantMeePermissionPayload = GrantMeePermissionResponseEntry[];

/**
 *
 * @param chainId - The chain ID to grant the session permission on
 * @param owner - The owner of the session
 * @param signer - The signer to use for the session
 * @param actions - The actions to grant the session permission for
 * @param apiKey - Biconomy API key to use for the session
 * @returns The transaction hash of the granted session permission
 */
export const grantSessionPermission = async (
  chainId: ChainId,
  owner: Signer,
  signer: Address,
  actions: SessionAction[],
  sponsorshipApiKey: string,
) => {
  const sessionsMeeClient = await buildBiconomySessionClient(
    SophonChains[chainId],
    owner,
    sponsorshipApiKey,
  );

  return sessionsMeeClient.grantPermissionTypedDataSign({
    redeemer: signer,
    actions: actions.map((it) => ({ ...it, chainId })),
  });
};

/**
 *
 * @param chainId - The chain ID to execute the action on
 * @param owner
 * @param sessionDetails - The session details to execute the action on
 * @param sponsorshipApiKey - The sponsorship API key to use for the action
 * @returns The transaction hash of the executed action
 */
export const executeSessionInstructions = async (
  chainId: ChainId,
  signer: Signer,
  smartAccountAddress: Address,
  sessionDetails: GrantMeePermissionPayload,
  instructions: Instruction[],
  sponsorshipApiKey: string,
) => {
  if (sessionDetails.length === 0) {
    throw new Error('No session details provided');
  }

  const sessionsMeeClient = await buildBiconomySessionClient(
    SophonChains[chainId],
    signer,
    sponsorshipApiKey,
    smartAccountAddress,
  );

  const isEnabled = await sessionsMeeClient.isPermissionEnabled({
    permissionId: sessionDetails[0].permissionId,
    chainId,
  });

  return sessionsMeeClient.usePermission({
    sessionDetails,
    mode: isEnabled ? 'USE' : 'ENABLE_AND_USE',
    instructions,
    sponsorship: true,
    sponsorshipOptions: {
      url: getDefaultMEENetworkUrl(IsStagingChain(chainId)),
      gasTank: getDefaultMeeGasTank(IsStagingChain(chainId)),
    },
  });
};
