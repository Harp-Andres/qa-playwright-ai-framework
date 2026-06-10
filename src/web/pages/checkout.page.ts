import { expect, type Page } from '@playwright/test';
import { SelfHealingLocator } from '../../ai/healing/selfHealingLocator';
import { checkoutSelectors } from '../selectors/checkout.selectors';

interface CheckoutData {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class CheckoutPage {
  private readonly healer: SelfHealingLocator;

  constructor(private readonly page: Page) {
    this.healer = new SelfHealingLocator(page);
  }

  async complete(data: CheckoutData): Promise<void> {
    await (await this.healer.locate(checkoutSelectors.checkoutButton)).click();
    await (await this.healer.locate(checkoutSelectors.firstName)).fill(data.firstName);
    await (await this.healer.locate(checkoutSelectors.lastName)).fill(data.lastName);
    await (await this.healer.locate(checkoutSelectors.zipCode)).fill(data.postalCode);
    await (await this.healer.locate(checkoutSelectors.continueButton)).click();
    await (await this.healer.locate(checkoutSelectors.finishButton)).click();
  }

  async assertSuccess(): Promise<void> {
    await expect(await this.healer.locate(checkoutSelectors.confirmation)).toContainText('Thank you');
  }
}
