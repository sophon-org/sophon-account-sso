import type { Page } from '@playwright/test';
import type { TestableActionsNames } from '../../lib/actions';

export type TestCase<T extends TestableActionsNames> = {
  method: T;
  name: `${T}-${string}`;
  payload: unknown;
  // biome-ignore lint/suspicious/noExplicitAny: dynamic testing
  isValidResponse: (response: any) => boolean;
};

export type AccountServerTestCase<T extends TestableActionsNames> =
  TestCase<T> & {
    accountServerActions: (page: Page) => Promise<void>;
  };
