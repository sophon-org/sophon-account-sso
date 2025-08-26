import { Locator, Page } from '@playwright/test';

export class AccountServerAuthenticationRequestPage {
  page: Page;

  acceptButton: Locator;
  cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.acceptButton = page.getByTestId('connect-accept-button');
    this.cancelButton = page.getByTestId('connect-cancel-button');
  }

  async authorizeConnection() {
    const closePagePromise = this.page.waitForEvent('close');
    await this.acceptButton.click();
    await closePagePromise;
  }

  async refuseConnection() {
    const closePagePromise = this.page.waitForEvent('close');
    await this.cancelButton.click();
    await closePagePromise;
  }
}
