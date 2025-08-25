import { faker } from '@faker-js/faker';
import { describe, expect, it, vi } from 'vitest';
import { announceEip6963Provider } from '../eip6963';

describe('EIP-6963 - Announcer', () => {
  it('should the event eip6963:announceProvider on execution', async () => {
    // given
    const mockProvider = {
      info: {
        uuid: faker.string.uuid(),
        name: faker.company.name(),
        icon: faker.image.url(),
        rdns: faker.internet.domainName(),
      },
      provider: {
        request: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn(),
      },
    };
    vi.spyOn(window, 'dispatchEvent').mockReturnValueOnce(true);

    // when
    announceEip6963Provider(mockProvider);

    // then
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      new CustomEvent('eip6963:announceProvider', {
        detail: Object.freeze(mockProvider),
      }),
    );
  });

  it('should register a listener for the event eip6963:requestProvider that triggers the announce event', async () => {
    // given
    const mockProvider = {
      info: {
        uuid: faker.string.uuid(),
        name: faker.company.name(),
        icon: faker.image.url(),
        rdns: faker.internet.domainName(),
      },
      provider: {
        request: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn(),
      },
    };
    vi.spyOn(window, 'dispatchEvent').mockReturnValue(true);
    vi.spyOn(window, 'addEventListener').mockReturnValueOnce();

    // when
    announceEip6963Provider(mockProvider);

    // simulate the event from wallet providers
    window.dispatchEvent(
      new CustomEvent('eip6963:requestProvider', {
        detail: Object.freeze(mockProvider),
      }),
    );

    // then
    expect(window.addEventListener).toHaveBeenCalledWith(
      'eip6963:requestProvider',
      expect.any(Function),
    );
    expect(window.dispatchEvent).toHaveBeenCalledTimes(2);
  });
});
