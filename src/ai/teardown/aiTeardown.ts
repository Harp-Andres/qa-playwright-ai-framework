import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { FullConfig } from '@playwright/test';
import { FlakinessDetector } from '../flakiness/flakinessDetector';
import { AiSuggestionEngine } from '../suggestions/aiSuggestionEngine';
import type { SuggestionRegistryModel } from '../suggestions/suggestionRegistry';

const SUGGESTIONS_PATH = 'artifacts/ai-suggestions.json';
const REPORT_PATH = 'artifacts/ai-report.json';

export default async function globalTeardown(_config: FullConfig): Promise<void> {
  if (!existsSync(SUGGESTIONS_PATH)) {
    return;
  }

  const raw = JSON.parse(readFileSync(SUGGESTIONS_PATH, 'utf-8')) as SuggestionRegistryModel;
  const signals = raw.failures ?? [];

  if (signals.length === 0) {
    return;
  }

  const summaries = FlakinessDetector.analyze(signals);
  const suggestions = AiSuggestionEngine.generate(summaries);

  const report = {
    generatedAt: new Date().toISOString(),
    totalFailures: signals.length,
    flakyTests: summaries.filter((s) => s.isFlaky).length,
    consistentFailures: summaries.filter((s) => !s.isFlaky).length,
    suggestions,
  };

  mkdirSync('artifacts', { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf-8');
}
