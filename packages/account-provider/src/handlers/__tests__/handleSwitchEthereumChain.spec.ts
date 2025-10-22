import { SophonHexChainId } from '@sophon-labs/account-core';
import { sophon, sophonTestnet } from 'viem/chains';
import { describe, expect, it } from 'vitest';
import { handleSwitchEthereumChain } from '../handleSwitchEthereumChain';

describe('Provider > Handlers > handleSwitchEthereumChain', () => {
  it.each([
    {
      currentChainId: sophonTestnet.id,
      targetChainId: SophonHexChainId[sophon.id],
      description: 'testnet to mainnet',
    },
    {
      currentChainId: sophon.id,
      targetChainId: SophonHexChainId[sophonTestnet.id],
      description: 'mainnet to testnet',
    },
    {
      currentChainId: sophonTestnet.id,
      targetChainId: SophonHexChainId[sophonTestnet.id],
      description: 'testnet to testnet (same chain)',
    },
  ])(
    'should return null for valid chain switch: $description',
    async ({ currentChainId, targetChainId }) => {
      // when
      const result = await handleSwitchEthereumChain(currentChainId, [
        { chainId: targetChainId },
      ]);

      // then
      expect(result).toBeNull();
    },
  );

  it('should throw an error if the target chain is not supported', async () => {
    // given
    const chainId = sophonTestnet.id;
    const unsupportedChainId = '0xCAFE'; // 51966 in decimal

    // when
    const call = () =>
      handleSwitchEthereumChain(chainId, [{ chainId: unsupportedChainId }]);

    // then
    await expect(call()).rejects.toThrow(
      `Unsupported chain on chainId ${chainId}: 51966`,
    );
  });

  it('should handle missing params gracefully', async () => {
    // given
    const chainId = sophonTestnet.id;

    // when
    const call = () => handleSwitchEthereumChain(chainId, []);

    // then
    await expect(call()).rejects.toThrow();
  });
});
