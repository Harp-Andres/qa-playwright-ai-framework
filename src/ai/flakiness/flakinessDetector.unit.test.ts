import { describe, expect, it } from 'vitest';
import { FlakinessDetector } from './flakinessDetector';
import type { FailureSignal } from '../failure/failureAnalyzer';

const baseSignal = (overrides: Partial<FailureSignal>): FailureSignal => ({
  testId: 'suite > test',
  retry: 0,
  category: 'timeout',
  message: 'timeout',
  metadata: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('FlakinessDetector', () => {
  it('marks tests flaky when a retry failure exists', () => {
    const summaries = FlakinessDetector.analyze([
      baseSignal({ retry: 0 }),
      baseSignal({ retry: 1, category: 'locator' }),
    ]);
    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.isFlaky).toBe(true);
    expect(summaries[0]?.categories.locator).toBe(1);
  });

  it('aggregates consistent failures', () => {
    const summaries = FlakinessDetector.analyze([
      baseSignal({ testId: 'a', retry: 0 }),
      baseSignal({ testId: 'b', retry: 0 }),
    ]);
    expect(summaries).toHaveLength(2);
    expect(summaries.every((s) => !s.isFlaky)).toBe(true);
  });
});
