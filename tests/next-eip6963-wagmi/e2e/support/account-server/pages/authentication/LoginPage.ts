import { Locator, Page } from '@playwright/test';
import { AccountServerAuthenticationRequestPage } from './AuthenticationRequestPage';

export class AccountServerLoginPage {
  page: Page;

  emailInput: Locator;
  emailSubmitButton: Locator;
  passwordInput: Locator;
  submitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailInput = page.getByTestId('login-email-input');
    this.emailSubmitButton = page.getByTestId('login-email-submit');
    this.passwordInput = page.getByTestId('login-otp-input');
    this.submitButton = page.getByTestId('login-otp-submit');
  }

  async login(email: string, otp: string) {
    console.log('Authenticating with email', email, otp);
    await this.emailInput.fill(email);
    await this.emailSubmitButton.click();
    await this.passwordInput.fill(otp);
    await this.submitButton.click();
    await this.page.waitForSelector('text=Connection request');
    return new AccountServerAuthenticationRequestPage(this.page);
  }
}
