import type { TestInfo } from '@playwright/test';
import type { FailureCategory } from './failureCategory';
import {
  defaultFailureStrategies,
  type FailureClassificationStrategy,
} from './failureClassificationStrategy';

export type { FailureCategory } from './failureCategory';

export interface FailureSignal {
  testId: string;
  retry: number;
  category: FailureCategory;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export class FailureAnalyzer {
  constructor(
    private readonly strategies: readonly FailureClassificationStrategy[] = defaultFailureStrategies,
  ) {}

  analyze(testInfo: TestInfo, metadata: Record<string, unknown>): FailureSignal {
    const message = testInfo.errors[0]?.message ?? 'Unknown failure';
    const category =
      this.strategies.find((strategy) => strategy.matches(message.toLowerCase()))?.category ??
      'unknown';

    return {
      testId: testInfo.titlePath.join(' > '),
      retry: testInfo.retry,
      category,
      message,
      metadata,
      createdAt: new Date().toISOString(),
    };
  }
}
