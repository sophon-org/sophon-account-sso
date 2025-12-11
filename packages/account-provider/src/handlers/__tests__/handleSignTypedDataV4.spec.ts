import { describe, expect, it, vi } from 'vitest';
import { handleSignTypedDataV4 } from '../handleSignTypedDataV4';

describe('Provider > Handlers > handleSignTypedDataV4', () => {
  it('should return result body if available', async () => {
    // given
    const expectedPayload = {
      account: { address: '0x1234567890123456789012345678901234567890' },
    };
    const sender = vi.fn().mockResolvedValueOnce({
      content: {
        result: expectedPayload,
      },
    });
    const params: [string, string] = [
      '0x1234567890123456789012345678901234567890',
      'Hello, world!',
    ];

    // when
    const result = await handleSignTypedDataV4(sender, params);

    // then
    expect(sender).toHaveBeenCalledWith('eth_signTypedData_v4', params);
    expect(result).toEqual(expectedPayload);
  });

  it('should throw an error if RPC responded with error', async () => {
    // given
    const errorPayload = { message: 'User Rejected' };
    const sender = vi.fn().mockResolvedValueOnce({
      content: {
        error: errorPayload,
      },
    });
    const params: [string, string] = [
      '0x1234567890123456789012345678901234567890',
      'Hello, world!',
    ];

    // when
    const call = () => handleSignTypedDataV4(sender, params);

    // then
    await expect(call()).rejects.toThrow(errorPayload.message);
    expect(sender).toHaveBeenCalledWith('eth_signTypedData_v4', params);
  });
});
