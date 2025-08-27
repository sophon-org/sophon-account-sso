/**
 * Utility functions for handling BigInt serialization/deserialization
 * Used for communication with the swap API
 */

export const bigintSerializer = (_key: string, value: unknown): unknown => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

export const bigintDeserializer = (_key: string, value: unknown): unknown => {
  if (typeof value === 'string' && /^\d+$/.test(value) && value.length > 15) {
    try {
      return BigInt(value);
    } catch {
      return value;
    }
  }
  return value;
};

/**
 * Serialize object for API transmission
 */
export const serializeForAPI = (obj: unknown): string => {
  return JSON.stringify(obj, bigintSerializer);
};

/**
 * Deserialize API response
 */
export const deserializeFromAPI = <T>(json: string): T => {
  return JSON.parse(json, bigintDeserializer);
};
