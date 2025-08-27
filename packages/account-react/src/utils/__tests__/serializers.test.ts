import { beforeEach, describe, expect, it } from 'vitest';
import {
  bigintDeserializer,
  bigintSerializer,
  deserializeFromAPI,
  serializeForAPI,
} from '../serializers';

describe('Serializers', () => {
  beforeEach(() => {
    // Clear any potential state
  });

  describe('bigintSerializer', () => {
    it('should convert bigint to string', () => {
      const result = bigintSerializer('amount', BigInt(123456789));
      expect(result).toBe('123456789');
    });

    it('should leave non-bigint values unchanged', () => {
      expect(bigintSerializer('name', 'test')).toBe('test');
      expect(bigintSerializer('count', 42)).toBe(42);
      expect(bigintSerializer('active', true)).toBe(true);
      expect(bigintSerializer('data', null)).toBe(null);
      expect(bigintSerializer('undefined', undefined)).toBe(undefined);
    });

    it('should handle zero bigint', () => {
      const result = bigintSerializer('amount', BigInt(0));
      expect(result).toBe('0');
    });

    it('should handle negative bigint', () => {
      const result = bigintSerializer('amount', BigInt(-123));
      expect(result).toBe('-123');
    });
  });

  describe('bigintDeserializer', () => {
    it('should convert large numeric strings to bigint', () => {
      const result = bigintDeserializer(
        'amount',
        '123456789012345678901234567890',
      );
      expect(result).toBe(BigInt('123456789012345678901234567890'));
      expect(typeof result).toBe('bigint');
    });

    it('should leave short numeric strings as strings', () => {
      const result = bigintDeserializer('count', '42');
      expect(result).toBe('42');
      expect(typeof result).toBe('string');
    });

    it('should leave non-numeric strings unchanged', () => {
      expect(bigintDeserializer('name', 'test')).toBe('test');
      expect(bigintDeserializer('hash', '0xabc123')).toBe('0xabc123');
      expect(bigintDeserializer('empty', '')).toBe('');
    });

    it('should leave non-string values unchanged', () => {
      expect(bigintDeserializer('count', 42)).toBe(42);
      expect(bigintDeserializer('active', true)).toBe(true);
      expect(bigintDeserializer('data', null)).toBe(null);
      expect(bigintDeserializer('undefined', undefined)).toBe(undefined);
      expect(bigintDeserializer('array', [])).toEqual([]);
      expect(bigintDeserializer('object', {})).toEqual({});
    });

    it('should handle edge cases for numeric strings', () => {
      // Exactly 15 characters - should stay string
      expect(bigintDeserializer('medium', '123456789012345')).toBe(
        '123456789012345',
      );

      // 16 characters - should become bigint
      const result = bigintDeserializer('large', '1234567890123456');
      expect(result).toBe(BigInt('1234567890123456'));
    });

    it('should handle invalid bigint strings gracefully', () => {
      const result = bigintDeserializer(
        'invalid',
        '123abc456789012345678901234567890',
      );
      expect(result).toBe('123abc456789012345678901234567890');
    });

    it('should handle strings with leading zeros', () => {
      const result = bigintDeserializer(
        'zero-padded',
        '0001234567890123456789',
      );
      expect(result).toBe(BigInt('0001234567890123456789'));
    });
  });

  describe('serializeForAPI', () => {
    it('should serialize object with bigint values', () => {
      const obj = {
        amount: BigInt(123456789),
        name: 'test',
        count: 42,
        active: true,
        nullValue: null,
      };

      const result = serializeForAPI(obj);
      const expected = JSON.stringify({
        amount: '123456789',
        name: 'test',
        count: 42,
        active: true,
        nullValue: null,
      });

      expect(result).toBe(expected);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should handle nested objects with bigint', () => {
      const obj = {
        transaction: {
          amount: BigInt(1000000000000000),
          value: BigInt(0),
          hash: '0xabc123',
        },
        metadata: {
          name: 'swap',
          chainId: 1,
          fees: {
            gas: BigInt(21000),
            protocol: BigInt(1000),
          },
        },
      };

      const result = serializeForAPI(obj);
      const parsed = JSON.parse(result);

      expect(parsed.transaction.amount).toBe('1000000000000000');
      expect(parsed.transaction.value).toBe('0');
      expect(parsed.transaction.hash).toBe('0xabc123');
      expect(parsed.metadata.name).toBe('swap');
      expect(parsed.metadata.chainId).toBe(1);
      expect(parsed.metadata.fees.gas).toBe('21000');
      expect(parsed.metadata.fees.protocol).toBe('1000');
    });

    it('should handle arrays with bigint values', () => {
      const obj = {
        amounts: [BigInt(100), BigInt(200), BigInt(300)],
        names: ['alice', 'bob', 'charlie'],
        mixed: [BigInt(123), 'test', 456, true],
      };

      const result = serializeForAPI(obj);
      const parsed = JSON.parse(result);

      expect(parsed.amounts).toEqual(['100', '200', '300']);
      expect(parsed.names).toEqual(['alice', 'bob', 'charlie']);
      expect(parsed.mixed).toEqual(['123', 'test', 456, true]);
    });

    it('should handle empty and edge cases', () => {
      expect(serializeForAPI({})).toBe('{}');
      expect(serializeForAPI([])).toBe('[]');
      expect(serializeForAPI(null)).toBe('null');
      expect(serializeForAPI('string')).toBe('"string"');
      expect(serializeForAPI(42)).toBe('42');
    });
  });

  describe('deserializeFromAPI', () => {
    it('should deserialize JSON with large numeric strings to bigint', () => {
      const json = JSON.stringify({
        amount: '1000000000000000',
        smallAmount: '100',
        name: 'test',
        count: 42,
        active: true,
      });

      const result = deserializeFromAPI(json);

      expect(result.amount).toBe(BigInt('1000000000000000'));
      expect(typeof result.amount).toBe('bigint');
      expect(result.smallAmount).toBe('100');
      expect(typeof result.smallAmount).toBe('string');
      expect(result.name).toBe('test');
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
    });

    it('should handle nested objects', () => {
      const json = JSON.stringify({
        transaction: {
          amount: '1000000000000000',
          hash: '0xabc123',
        },
        fees: {
          gas: '21000',
          total: '22000',
        },
        metadata: {
          chainId: 1,
          name: 'test',
        },
      });

      const result = deserializeFromAPI(json);

      expect(result.transaction.amount).toBe(BigInt('1000000000000000'));
      expect(result.transaction.hash).toBe('0xabc123');
      expect(result.fees.gas).toBe('21000'); // Short number stays string
      expect(result.fees.total).toBe('22000'); // Short number stays string
      expect(result.metadata.chainId).toBe(1);
      expect(result.metadata.name).toBe('test');
    });

    it('should handle arrays', () => {
      const json = JSON.stringify({
        amounts: ['1000000000000000', '2000000000000000'],
        smallAmounts: ['100', '200'],
        names: ['alice', 'bob'],
        mixed: ['1000000000000000', 'test', 42, true],
      });

      const result = deserializeFromAPI(json);

      expect(result.amounts[0]).toBe(BigInt('1000000000000000'));
      expect(result.amounts[1]).toBe(BigInt('2000000000000000'));
      expect(result.smallAmounts).toEqual(['100', '200']);
      expect(result.names).toEqual(['alice', 'bob']);
      expect(result.mixed[0]).toBe(BigInt('1000000000000000'));
      expect(result.mixed[1]).toBe('test');
      expect(result.mixed[2]).toBe(42);
      expect(result.mixed[3]).toBe(true);
    });

    it('should handle malformed JSON gracefully', () => {
      expect(() => deserializeFromAPI('invalid json')).toThrow();
      expect(() => deserializeFromAPI('')).toThrow();
    });

    it('should handle primitive values', () => {
      expect(deserializeFromAPI('"test"')).toBe('test');
      expect(deserializeFromAPI('42')).toBe(42);
      expect(deserializeFromAPI('true')).toBe(true);
      expect(deserializeFromAPI('null')).toBe(null);
    });
  });

  describe('round-trip serialization', () => {
    it('should maintain data integrity through serialize/deserialize cycle', () => {
      const originalData = {
        amount: BigInt('1000000000000000'),
        recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        chainId: 8453,
        active: true,
        metadata: {
          fee: BigInt('21000'),
          name: 'test-transaction',
          values: [BigInt('100'), BigInt('200')],
        },
        smallNumbers: [1, 2, 3],
        strings: ['a', 'b', 'c'],
      };

      const serialized = serializeForAPI(originalData);
      const deserialized = deserializeFromAPI(serialized);

      expect(deserialized.amount).toBe(originalData.amount);
      expect(deserialized.recipient).toBe(originalData.recipient);
      expect(deserialized.chainId).toBe(originalData.chainId);
      expect(deserialized.active).toBe(originalData.active);
      expect(deserialized.metadata.fee).toBe('21000'); // Too short to be deserialized as BigInt
      expect(deserialized.metadata.name).toBe(originalData.metadata.name);
      expect(deserialized.metadata.values[0]).toBe('100'); // Too short to be deserialized as BigInt
      expect(deserialized.metadata.values[1]).toBe('200'); // Too short to be deserialized as BigInt
      expect(deserialized.smallNumbers).toEqual(originalData.smallNumbers);
      expect(deserialized.strings).toEqual(originalData.strings);
    });

    it('should handle complex nested structures', () => {
      const complexData = {
        level1: {
          level2: {
            level3: {
              bigValue: BigInt('999999999999999999'),
              array: [
                { id: 1, amount: BigInt('123456789012345678') },
                { id: 2, amount: BigInt('987654321098765432') },
              ],
            },
          },
        },
      };

      const serialized = serializeForAPI(complexData);
      const deserialized = deserializeFromAPI(serialized);

      expect(deserialized.level1.level2.level3.bigValue).toBe(
        BigInt('999999999999999999'),
      );
      expect(deserialized.level1.level2.level3.array[0].amount).toBe(
        BigInt('123456789012345678'),
      );
      expect(deserialized.level1.level2.level3.array[1].amount).toBe(
        BigInt('987654321098765432'),
      );
    });

    it('should preserve type information correctly', () => {
      const data = {
        bigintValue: BigInt('1000000000000000'),
        numberValue: 42,
        stringValue: 'test',
        booleanValue: true,
        nullValue: null,
        undefinedValue: undefined, // Will be removed in JSON
        arrayValue: [1, 2, 3],
        objectValue: { nested: 'value' },
      };

      const serialized = serializeForAPI(data);
      const deserialized = deserializeFromAPI(serialized);

      expect(typeof deserialized.bigintValue).toBe('bigint');
      expect(typeof deserialized.numberValue).toBe('number');
      expect(typeof deserialized.stringValue).toBe('string');
      expect(typeof deserialized.booleanValue).toBe('boolean');
      expect(deserialized.nullValue).toBe(null);
      expect(deserialized.undefinedValue).toBe(undefined); // undefined is lost in JSON
      expect(Array.isArray(deserialized.arrayValue)).toBe(true);
      expect(typeof deserialized.objectValue).toBe('object');
    });
  });
});
