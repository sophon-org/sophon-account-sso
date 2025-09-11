import { describe, expect, it } from 'vitest';
import { clearAccounts, setAccounts } from '../../lib/accounts';
import { handleAccounts } from '../handleAccounts';

describe('handleAccounts', () => {
  it('should return the available accounts for the given network', async () => {
    // given
    const network = 'mainnet';
    const accounts = ['0x1234567890123456789012345678901234567890'];
    setAccounts(network, accounts);

    // when
    const result = await handleAccounts(network);

    // then
    expect(result).toEqual(accounts);
  });

  it('should return an empty array if not accounts are set', async () => {
    // given
    const network = 'mainnet';
    clearAccounts(network);

    // when
    const result = await handleAccounts(network);

    // then
    expect(result).toEqual([]);
  });
});
