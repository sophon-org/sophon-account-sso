import {
  SophonHexChainId,
  sophonOS,
  sophonOSTestnet,
} from '@sophon-labs/account-core';
import { toHex } from 'viem';
import { sophon, sophonTestnet } from 'viem/chains';
import { describe, expect, it } from 'vitest';
import { handleChainId } from '../handleChainId';

describe('Provider > Handlers > handleChainId', () => {
  it.each([
    { chainId: sophon.id, description: 'sophon mainnet' },
    { chainId: sophonTestnet.id, description: 'sophon testnet' },
    { chainId: sophonOS.id, description: 'sophon OS mainnet' },
    { chainId: sophonOSTestnet.id, description: 'sophon OS testnet' },
  ])('should return hex chainId for $description', async ({ chainId }) => {
    // given
    const expectedChainId = SophonHexChainId[chainId];

    // when
    const result = await handleChainId(chainId);

    // then
    expect(result).toBe(expectedChainId);
    expect(result).toBe(toHex(chainId));
  });
});
