import type { TestInfo } from '@playwright/test';

export type FailureCategory = 'locator' | 'timeout' | 'network' | 'assertion' | 'unknown';

export interface FailureSignal {
  testId: string;
  retry: number;
  category: FailureCategory;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export class FailureAnalyzer {
  static analyze(testInfo: TestInfo, metadata: Record<string, unknown>): FailureSignal {
    const message = testInfo.errors[0]?.message ?? 'Unknown failure';
    const lower = message.toLowerCase();

    const category: FailureCategory = lower.includes('locator')
      ? 'locator'
      : lower.includes('timeout')
        ? 'timeout'
        : lower.includes('network')
          ? 'network'
          : lower.includes('expect')
            ? 'assertion'
            : 'unknown';

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
