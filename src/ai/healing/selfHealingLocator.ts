import type { Locator, Page } from '@playwright/test';
import { logger } from '../../utils/logger';

export interface LocatorDefinition {
  name: string;
  primary: string;
  fallbacks?: string[];
}

export interface LocatorAttempt {
  locatorName: string;
  selector: string;
  strategy: 'primary' | 'fallback';
  success: boolean;
}

export class SelfHealingLocator {
  constructor(private readonly page: Page) {}

  async locate(definition: LocatorDefinition): Promise<Locator> {
    const selectors = [definition.primary, ...(definition.fallbacks ?? [])];

    for (const [index, selector] of selectors.entries()) {
      const locator = this.toLocator(selector);
      const isVisible = await locator.first().isVisible({ timeout: 2_000 }).catch(() => false);

      const attempt: LocatorAttempt = {
        locatorName: definition.name,
        selector,
        strategy: index === 0 ? 'primary' : 'fallback',
        success: isVisible,
      };

      logger.debug({ attempt }, 'Self-healing locator attempt');

      if (isVisible) {
        return locator;
      }
    }

    throw new Error(`Self-healing locator failed for ${definition.name}`);
  }

  private toLocator(selector: string): Locator {
    if (selector.startsWith('role=')) {
      const [, role, rawName] = selector.split('=');
      return this.page.getByRole(role as never, { name: rawName });
    }

    if (selector.startsWith('text=')) {
      return this.page.getByText(selector.replace('text=', ''), { exact: false });
    }

    if (selector.startsWith('testid=')) {
      return this.page.getByTestId(selector.replace('testid=', ''));
    }

    if (selector.startsWith('id=')) {
      return this.page.locator(`#${selector.replace('id=', '')}`);
    }

    return this.page.locator(selector);
  }
}
