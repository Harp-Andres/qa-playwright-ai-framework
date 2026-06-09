import type { FailureSignal } from '../failure/failureAnalyzer';

export interface FlakyTestSummary {
  testId: string;
  totalFailures: number;
  categories: Record<string, number>;
  /**
   * A test is considered flaky when at least one of its failures happened on a
   * retry attempt, meaning it passed at some point but failed again later.
   */
  isFlaky: boolean;
  lastSeen: string;
}

export class FlakinessDetector {
  static analyze(signals: FailureSignal[]): FlakyTestSummary[] {
    const grouped = new Map<string, FailureSignal[]>();

    for (const signal of signals) {
      const existing = grouped.get(signal.testId) ?? [];
      existing.push(signal);
      grouped.set(signal.testId, existing);
    }

    return Array.from(grouped.entries()).map(([testId, failures]) => {
      const categories: Record<string, number> = {};
      for (const f of failures) {
        categories[f.category] = (categories[f.category] ?? 0) + 1;
      }

      return {
        testId,
        totalFailures: failures.length,
        categories,
        isFlaky: failures.some((f) => f.retry > 0),
        lastSeen: failures.at(-1)?.createdAt ?? '',
      };
    });
  }
}
