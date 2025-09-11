import {
  MAINNET_HEX_CHAIN_ID,
  type SophonNetworkType,
  TESTNET_HEX_CHAIN_ID,
} from '@sophon-labs/account-core';
import { describe, expect, it } from 'vitest';
import { handleChainId } from '../handleChainId';

describe('handleChainId', () => {
  it.each([
    ['mainnet' as SophonNetworkType, MAINNET_HEX_CHAIN_ID],
    ['testnet' as SophonNetworkType, TESTNET_HEX_CHAIN_ID],
  ])(
    'should return network "%s" chainId "%s"',
    async (network: SophonNetworkType, expectedChainId: string) => {
      // when
      const result = await handleChainId(network);

      // then
      expect(result).toEqual(expectedChainId);
    },
  );
});
