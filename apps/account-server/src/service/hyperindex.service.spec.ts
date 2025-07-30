import { describe, expect, it } from 'vitest';
import { hyperindexService } from './hyperindex.service';

describe('Hyper Index Service', () => {
  it('should return the correct list of smart accounts owned by and specific address', async () => {
    // when
    const result = await hyperindexService.getOwnedSmartAccounts(
      '0xC988e0b689898c3D1528182F6917b765aB6C469A',
    );

    // then
    expect(result).toContain('0xf9a674763a544b64d1f24ddb4555f9c22e863fe6');
  });
});
