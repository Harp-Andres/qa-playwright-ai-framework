import { expect, type Page } from '@playwright/test';
import { getEnvConfig } from '../../config/env';
import { SelfHealingLocator } from '../../ai/healing/selfHealingLocator';
import { loginSelectors } from '../selectors/login.selectors';

export class LoginPage {
  private readonly healer: SelfHealingLocator;

  constructor(private readonly page: Page) {
    this.healer = new SelfHealingLocator(page);
  }

  async open(): Promise<void> {
    const env = getEnvConfig();
    await this.page.goto(env.SAUCE_BASE_URL);
  }

  async login(username: string, password: string): Promise<void> {
    await (await this.healer.locate(loginSelectors.usernameInput)).fill(username);
    await (await this.healer.locate(loginSelectors.passwordInput)).fill(password);
    await (await this.healer.locate(loginSelectors.loginButton)).click();
  }

  async assertInventoryLoaded(): Promise<void> {
    await expect(await this.healer.locate(loginSelectors.inventoryContainer)).toBeVisible();
    await expect(this.page).toHaveURL(/inventory.html/);
  }
}
