import { describe, expect, it } from 'vitest';
import { clearAccounts, getAccounts, setAccounts } from '../../lib/accounts';

describe('accounts storage', () => {
  it('should return empty array if no accounts are set', async () => {
    // given
    const network = 'testnet';
    clearAccounts(network);

    // when
    const result = getAccounts(network);

    // then
    expect(result).toEqual([]);
  });

  it('should return the accounts for the given network', async () => {
    // given
    const network = 'testnet';
    const accounts = ['0x1234567890123456789012345678901234567890'];
    setAccounts(network, accounts);

    // when
    const result = getAccounts(network);

    // then
    expect(result).toEqual(accounts);
  });
});
