import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { FullConfig } from '@playwright/test';
import { FlakinessDetector } from '../flakiness/flakinessDetector';
import { AiSuggestionEngine } from '../suggestions/aiSuggestionEngine';
import type { SuggestionRegistryModel } from '../suggestions/suggestionRegistry';

const ARTIFACTS_DIR = 'artifacts';
const REPORT_PATH = join(ARTIFACTS_DIR, 'ai-report.json');

function mergeWorkerFiles(): SuggestionRegistryModel {
  const merged: SuggestionRegistryModel = { failures: [] };

  if (!existsSync(ARTIFACTS_DIR)) {
    return merged;
  }

  const workerFiles = readdirSync(ARTIFACTS_DIR).filter((f) =>
    /^ai-suggestions-\d+\.json$/.test(f),
  );

  for (const file of workerFiles) {
    const raw = JSON.parse(
      readFileSync(join(ARTIFACTS_DIR, file), 'utf-8'),
    ) as SuggestionRegistryModel;
    merged.failures.push(...(raw.failures ?? []));
  }

  return merged;
}

export default async function globalTeardown(_config: FullConfig): Promise<void> {
  const { failures: signals } = mergeWorkerFiles();

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

  mkdirSync(ARTIFACTS_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf-8');
}
