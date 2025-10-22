import { describe, expect, it } from 'vitest';
import { shortenAddress } from '../formatters';

describe('Core > Formatters', () => {
  describe('shortenAddress', () => {
    it.each([
      {
        address: undefined,
        expected: undefined,
        description: 'undefined address',
      },
      {
        address: '' as `0x${string}`,
        expected: undefined,
        description: 'empty string',
      },
      {
        address: '0x123' as `0x${string}`,
        expected: '0x123',
        description: 'short address',
      },
      {
        address: '0x12345' as `0x${string}`,
        expected: '0x12345',
        description: 'address shorter than format',
      },
    ])(
      'should return $expected when given $description',
      ({ address, expected }) => {
        // given
        const input = address;

        // when
        const result = shortenAddress(input);

        // then
        expect(result).toBe(expected);
      },
    );

    it('should shorten a valid Ethereum address with default length', () => {
      // given
      const address =
        '0x1234567890123456789012345678901234567890' as `0x${string}`;

      // when
      const result = shortenAddress(address);

      // then
      expect(result).toBe('0x123...67890');
    });

    it('should shorten a valid Ethereum address with custom length', () => {
      // given
      const address =
        '0x1234567890123456789012345678901234567890' as `0x${string}`;
      const length = 5;

      // when
      const result = shortenAddress(address, length);

      // then
      expect(result).toBe('0x12345...67890');
    });

    it('should shorten address with length = 1', () => {
      // given
      const address =
        '0x1234567890123456789012345678901234567890' as `0x${string}`;
      const length = 1;

      // when
      const result = shortenAddress(address, length);

      // then
      expect(result).toBe('0x1...67890');
    });

    it('should handle checksummed addresses without changing case', () => {
      // given
      const address =
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed' as `0x${string}`;

      // when
      const result = shortenAddress(address);

      // then
      expect(result).toBe('0x5aA...BeAed');
    });
  });
});
