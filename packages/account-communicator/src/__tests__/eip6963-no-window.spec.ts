// @vitest-environment node
import { faker } from '@faker-js/faker';
import { describe, expect, it, vi } from 'vitest';
import { announceEip6963Provider } from '../eip6963';

describe('EIP-6963 - Announcer - No window', () => {
  it('should the announcer do nothing if window is not defined', async () => {
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

    // when
    announceEip6963Provider(mockProvider);

    // then
    expect(global.window).toBeUndefined();
  });
});
