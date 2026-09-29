import type { Locator, Page } from '@playwright/test';
import { getLogger } from '../../utils/logger';
import { parseLocatorSelector } from './locatorSelector';

export interface LocatorDefinition {
  name: string;
  primary: string;
  fallbacks?: string[];
}

export interface LocatorAttempt {
  locatorName: string;
  strategy: 'primary' | 'fallback';
  success: boolean;
}

const PRIMARY_TIMEOUT_MS = 10_000;
const FALLBACK_TIMEOUT_MS = 2_000;

export class SelfHealingLocator {
  constructor(private readonly page: Page) {}

  async locate(definition: LocatorDefinition): Promise<Locator> {
    const selectors = [definition.primary, ...(definition.fallbacks ?? [])];

    for (const [index, selector] of selectors.entries()) {
      const locator = this.toLocator(selector);
      // isVisible() does not wait, so a page still loading would skip every selector.
      const isVisible = await locator
        .first()
        .waitFor({
          state: 'visible',
          timeout: index === 0 ? PRIMARY_TIMEOUT_MS : FALLBACK_TIMEOUT_MS,
        })
        .then(() => true)
        .catch(() => false);

      const attempt: LocatorAttempt = {
        locatorName: definition.name,
        strategy: index === 0 ? 'primary' : 'fallback',
        success: isVisible,
      };

      getLogger().debug(
        { strategy: attempt.strategy, success: attempt.success },
        'Self-healing locator attempt',
      );

      if (isVisible) {
        return locator;
      }
    }

    throw new Error(`Self-healing locator failed for ${definition.name}`);
  }

  private toLocator(selector: string): Locator {
    const parsed = parseLocatorSelector(selector);

    switch (parsed.kind) {
      case 'role':
        return this.page.getByRole(
          (parsed.role ?? parsed.value) as never,
          parsed.roleName ? { name: parsed.roleName } : undefined,
        );
      case 'text':
        return this.page.getByText(parsed.value, { exact: false });
      case 'testid':
        return this.page.getByTestId(parsed.value);
      case 'id':
        return this.page.locator(`#${parsed.value}`);
      default:
        return this.page.locator(parsed.value);
    }
  }
}
