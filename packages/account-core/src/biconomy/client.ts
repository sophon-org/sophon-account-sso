import {
  createMeeClient,
  getDefaultMEENetworkUrl,
  getMEEVersion,
  MEEVersion,
  meeSessionActions,
  type Signer,
  toMultichainNexusAccount,
} from '@biconomy/abstractjs';
import { type Address, type Chain, http } from 'viem';
import { isChainId } from '../chain-helpers';
import { type ChainId, IsStagingChain } from '../constants';

/**
 * Helper function to build a Biconomy account object
 *
 * @param chain - The chain to create the account on
 * @param signer - The signer to use for the account
 * @param accountAddress - The address of the account to create, if not provided, the signer's address will be used
 * @returns The created Biconomy account object
 */
export const buildBiconomyAccount = async (
  chain: Chain,
  signer: Signer,
  accountAddress?: Address,
) => {
  if (!isChainId(chain.id)) {
    throw new Error(`Chain ${chain.id} not supported`);
  }

  return await toMultichainNexusAccount({
    signer,
    chainConfigurations: [
      {
        chain,
        transport: http(),
        version: getMEEVersion(MEEVersion.V2_2_1),
        accountAddress: accountAddress ?? signer.address,
      },
    ],
  });
};

/**
 * Helper function to build a Biconomy client object with session capabilities
 *
 * @param chain - The chain to create the session client on
 * @param signer - The signer to use for the session client
 * @param apiKey - Biconomy API key to use for the session client
 * @param accountAddress - The address of the account to create, if not provided, the signer's address will be used
 * @returns The created Biconomy session client object
 */
export const buildBiconomySessionClient = async (
  chain: Chain,
  signer: Signer,
  apiKey: string,
  accountAddress?: Address,
) => {
  if (!apiKey) {
    throw new Error('Sponsorship API key is not set');
  }

  if (!isChainId(chain.id)) {
    throw new Error(`Chain ${chain.id} not supported`);
  }

  const smartAccount = await buildBiconomyAccount(
    chain,
    signer,
    accountAddress,
  );

  const meeClient = await createMeeClient({
    account: smartAccount,
    url: getDefaultMEENetworkUrl(IsStagingChain(chain.id as ChainId)),
    apiKey,
  });

  return meeClient.extend(meeSessionActions);
};
