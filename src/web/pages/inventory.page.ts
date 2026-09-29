import { expect, type Page } from '@playwright/test';
import { SelfHealingLocator } from '../../ai/healing/selfHealingLocator';
import { addToCartButton, inventorySelectors } from '../selectors/inventory.selectors';

export class InventoryPage {
  private readonly healer: SelfHealingLocator;

  constructor(private readonly page: Page) {
    this.healer = new SelfHealingLocator(page);
  }

  async addProductToCart(productName: string): Promise<void> {
    await (await this.healer.locate(addToCartButton(productName))).click();
  }

  async openCartAndValidateCount(expectedCount: string): Promise<void> {
    await expect(await this.healer.locate(inventorySelectors.cartBadge)).toHaveText(expectedCount);
    await (await this.healer.locate(inventorySelectors.cartLink)).click();
  }
}
