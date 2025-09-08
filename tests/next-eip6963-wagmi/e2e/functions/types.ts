import type { Page } from '@playwright/test';
import type * as wagmiActions from 'wagmi/actions';
import type { TestableActionsNames } from '../../lib/actions';

export type TestCase<T extends TestableActionsNames> = {
  method: T;
  name: `${T}-${string}`;
  payload: Parameters<(typeof wagmiActions)[T]>[1];
  isValidResponse: (
    response: Awaited<ReturnType<(typeof wagmiActions)[T]>>,
  ) => boolean;
};

export type AccountServerTestCase<T extends TestableActionsNames> =
  TestCase<T> & {
    accountServerActions: (page: Page) => Promise<void>;
  };
