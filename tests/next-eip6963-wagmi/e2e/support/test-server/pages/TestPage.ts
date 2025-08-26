import type { BrowserContext, Locator, Page } from '@playwright/test';
import { AccountServerLoginPage } from '../../account-server/pages/authentication/LoginPage';

export class TestServerPage {
  page: Page;
  context: BrowserContext;

  connectButton: Locator;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;

    this.connectButton = page.getByTestId('connect-button');
  }

  async gotoHome() {
    await this.page.goto('http://localhost:3100');
  }

  async clickLoginButton() {
    const authServerPromise = this.context.waitForEvent('page');
    await this.connectButton.click();
    const loginPage = new AccountServerLoginPage(await authServerPromise);
    return loginPage;
    // return new AccountServerAuthenticationRequestPage(this.page);
  }
}
