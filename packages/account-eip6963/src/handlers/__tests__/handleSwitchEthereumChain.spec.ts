import {
  MAINNET_HEX_CHAIN_ID,
  type SophonNetworkType,
  TESTNET_HEX_CHAIN_ID,
} from '@sophon-labs/account-core';
import { describe, expect, it } from 'vitest';
import { handleSwitchEthereumChain } from '../handleSwitchEthereumChain';

describe('handleSwitchEthereumChain', () => {
  it.each([
    ['testnet' as SophonNetworkType, MAINNET_HEX_CHAIN_ID],
    ['mainnet' as SophonNetworkType, TESTNET_HEX_CHAIN_ID],
  ])(
    'should return null if the chain is "%s"',
    async (network: SophonNetworkType, chainId: string) => {
      // when
      const result = await handleSwitchEthereumChain(network, [{ chainId }]);

      // then
      expect(result).toEqual(null);
    },
  );

  it('should throw an error if the chain is not supported', async () => {
    // given
    const network = 'testnet';

    // when
    const call = () =>
      handleSwitchEthereumChain(network, [{ chainId: '0xCAFE' }]);

    // then
    await expect(call()).rejects.toThrow(
      `Unsupported chain on network ${network}: 51966`,
    );
  });
});
