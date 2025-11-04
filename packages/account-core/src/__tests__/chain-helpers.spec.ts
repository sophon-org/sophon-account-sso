import { describe, expect, it } from 'vitest';
import { safeParseTypedData } from '../chain-helpers';
import type { TypedDataSigningRequest } from '../types/storage';

describe('Core > Chain Helpers', () => {
  describe('safeParseTypedData', () => {
    it('should return typedData as-is when domain is not provided', () => {
      // given
      const typedData = {
        types: {
          EIP712Domain: [],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
        primaryType: 'Person',
        message: {
          name: 'Bob',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
      } as unknown as TypedDataSigningRequest;

      // when
      const result = safeParseTypedData(typedData);

      // then
      expect(result).toEqual(typedData);
    });

    it('should return typedData as-is when chainId is not provided', () => {
      // given
      const typedData = {
        domain: {
          name: 'Example Dapp',
          version: '1',
        },
        types: {
          EIP712Domain: [],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
        primaryType: 'Person',
        message: {
          name: 'Bob',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
      } as unknown as TypedDataSigningRequest;

      // when
      const result = safeParseTypedData(typedData);

      // then
      expect(result).toEqual(typedData);
    });

    it.each([
      { chainId: '0x1', expected: 1, description: 'hexadecimal string "0x1"' },
      {
        chainId: '0x89',
        expected: 137,
        description: 'hexadecimal string "0x89" (Polygon)',
      },
      {
        chainId: '0x2a',
        expected: 42,
        description: 'hexadecimal string "0x2a"',
      },
      {
        chainId: '0xa4b1',
        expected: 42161,
        description: 'hexadecimal string "0xa4b1" (Arbitrum)',
      },
    ])(
      'should convert $description to number $expected',
      ({ chainId, expected }) => {
        // given
        const typedData = {
          domain: {
            name: 'Example Dapp',
            version: '1',
            chainId: chainId as unknown as number,
          },
          types: {
            EIP712Domain: [],
            Person: [
              { name: 'name', type: 'string' },
              { name: 'wallet', type: 'address' },
            ],
          },
          primaryType: 'Person',
          message: {
            name: 'Bob',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
        } as unknown as TypedDataSigningRequest;

        // when
        const result = safeParseTypedData(typedData);

        // then
        expect(result.domain?.chainId).toBe(expected);
        expect(typeof result.domain?.chainId).toBe('number');
      },
    );

    it.each([
      { chainId: '1', expected: 1, description: 'decimal string "1"' },
      {
        chainId: '137',
        expected: 137,
        description: 'decimal string "137" (Polygon)',
      },
      { chainId: '42', expected: 42, description: 'decimal string "42"' },
      {
        chainId: '42161',
        expected: 42161,
        description: 'decimal string "42161" (Arbitrum)',
      },
    ])(
      'should convert $description to number $expected',
      ({ chainId, expected }) => {
        // given
        const typedData = {
          domain: {
            name: 'Example Dapp',
            version: '1',
            chainId: chainId as unknown as number,
          },
          types: {
            EIP712Domain: [],
            Person: [
              { name: 'name', type: 'string' },
              { name: 'wallet', type: 'address' },
            ],
          },
          primaryType: 'Person',
          message: {
            name: 'Bob',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
        } as unknown as TypedDataSigningRequest;

        // when
        const result = safeParseTypedData(typedData);

        // then
        expect(result.domain?.chainId).toBe(expected);
        expect(typeof result.domain?.chainId).toBe('number');
      },
    );

    it.each([
      { chainId: 1, description: 'number 1 (Ethereum)' },
      { chainId: 137, description: 'number 137 (Polygon)' },
      { chainId: 42161, description: 'number 42161 (Arbitrum)' },
      { chainId: 10, description: 'number 10 (Optimism)' },
    ])('should return $description as-is', ({ chainId }) => {
      // given
      const typedData = {
        domain: {
          name: 'Example Dapp',
          version: '1',
          chainId,
        },
        types: {
          EIP712Domain: [],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
        primaryType: 'Person',
        message: {
          name: 'Bob',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
      } as unknown as TypedDataSigningRequest;

      // when
      const result = safeParseTypedData(typedData);

      // then
      expect(result.domain?.chainId).toBe(chainId);
      expect(typeof result.domain?.chainId).toBe('number');
    });

    it('should preserve other domain properties when converting chainId', () => {
      // given
      const typedData = {
        domain: {
          name: 'Example Dapp',
          version: '1',
          chainId: '0x1' as unknown as number,
          verifyingContract:
            '0x1234567890123456789012345678901234567890' as `0x${string}`,
        },
        types: {
          EIP712Domain: [],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
        primaryType: 'Person',
        message: {
          name: 'Bob',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
      } as unknown as TypedDataSigningRequest;

      // when
      const result = safeParseTypedData(typedData);

      // then
      expect(result.domain?.name).toBe('Example Dapp');
      expect(result.domain?.version).toBe('1');
      expect(result.domain?.verifyingContract).toBe(
        '0x1234567890123456789012345678901234567890',
      );
      expect(result.domain?.chainId).toBe(1);
    });
  });
});
