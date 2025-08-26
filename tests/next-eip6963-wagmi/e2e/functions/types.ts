import type { Page } from '@playwright/test';
import type { TestableActionsNames } from '../../lib/actions';

export type TestCase = {
  name: TestableActionsNames;
  payload: unknown;
  isValidResponse: (response: unknown) => boolean;
};

export type AccountServerTestCase = TestCase & {
  accountServerActions: (page: Page) => Promise<void>;
};
