import { test as base } from '@playwright/test';
import { TestServerPage } from './pages/TestPage';

type MyFixtures = {
  testServerPage: TestServerPage;
};

export const test = base.extend<MyFixtures>({
  testServerPage: async ({ page, context }, use) => {
    await use(new TestServerPage(page, context));
  },
});

export { expect } from '@playwright/test';
