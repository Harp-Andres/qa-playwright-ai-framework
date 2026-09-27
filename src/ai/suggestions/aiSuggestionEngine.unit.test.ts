import { describe, expect, it } from 'vitest';
import { AiSuggestionEngine } from './aiSuggestionEngine';
import type { FlakyTestSummary } from '../flakiness/flakinessDetector';

describe('AiSuggestionEngine', () => {
  it('returns recommendations for the dominant failure category', () => {
    const summaries: FlakyTestSummary[] = [
      {
        testId: 'checkout',
        totalFailures: 2,
        categories: { locator: 2 },
        isFlaky: true,
        lastSeen: '2026-01-01',
      },
    ];

    const suggestions = AiSuggestionEngine.generate(summaries);
    expect(suggestions[0]?.topCategory).toBe('locator');
    expect(suggestions[0]?.recommendations.length).toBeGreaterThan(0);
  });
});
