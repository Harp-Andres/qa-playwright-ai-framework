import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FailureSignal } from '../failure/failureAnalyzer';

export interface SuggestionRegistryModel {
  failures: FailureSignal[];
}

export class SuggestionRegistry {
  private readonly data: SuggestionRegistryModel;

  constructor(
    private readonly path = `artifacts/ai-suggestions-${process.env.TEST_WORKER_INDEX ?? '0'}.json`,
  ) {
    if (existsSync(path)) {
      this.data = JSON.parse(readFileSync(path, 'utf-8')) as SuggestionRegistryModel;
    } else {
      this.data = { failures: [] };
    }
  }

  addFailure(signal: FailureSignal): void {
    this.data.failures.push(signal);
    this.persist();
  }

  getAll(): FailureSignal[] {
    return [...this.data.failures];
  }

  private persist(): void {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, `${JSON.stringify(this.data, null, 2)}\n`, 'utf-8');
  }
}
