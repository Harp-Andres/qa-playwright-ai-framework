import type { FailureCategory } from '../failure/failureAnalyzer';
import type { FlakyTestSummary } from '../flakiness/flakinessDetector';

const RECOMMENDATIONS: Record<FailureCategory, string[]> = {
  locator: [
    'Add data-testid attributes to frequently broken selectors.',
    'Register additional fallback selectors in the SelfHealingLocator definition.',
    'Consider adding aria-label attributes to improve selector stability.',
  ],
  timeout: [
    'Increase actionTimeout for this specific interaction.',
    'Add an explicit wait condition before the action that timed out.',
    'Check for slow network responses or CSS animations blocking the element.',
  ],
  network: [
    'Verify the API endpoint is stable or mock it in the CI environment.',
    'Add retry logic in the API client for transient network errors.',
    'Consider using the mock-api-server for this endpoint in CI.',
  ],
  assertion: [
    'Review the expected value; the page content or API contract may have changed.',
    'Use a partial/soft assertion first to narrow down the mismatch.',
    'Ensure the element is fully rendered before asserting visibility or text.',
  ],
  unknown: [
    'Capture a screenshot and a trace on failure for deeper analysis.',
    'Review the full error stack trace in the Playwright HTML report.',
    'Enable verbose logging (LOG_LEVEL=debug) to trace the exact failure point.',
  ],
};

export interface AiSuggestion {
  testId: string;
  isFlaky: boolean;
  topCategory: string;
  recommendations: string[];
}

export class AiSuggestionEngine {
  static generate(summaries: FlakyTestSummary[]): AiSuggestion[] {
    return summaries.map((summary) => {
      const topCategory =
        Object.entries(summary.categories).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'unknown';

      return {
        testId: summary.testId,
        isFlaky: summary.isFlaky,
        topCategory,
        recommendations: RECOMMENDATIONS[topCategory as FailureCategory] ?? RECOMMENDATIONS.unknown,
      };
    });
  }
}
