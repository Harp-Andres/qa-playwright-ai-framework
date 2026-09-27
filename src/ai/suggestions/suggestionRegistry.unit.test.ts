import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SuggestionRegistry } from './suggestionRegistry';
import type { FailureSignal } from '../failure/failureAnalyzer';

const sampleSignal: FailureSignal = {
  testId: 'suite > test',
  retry: 0,
  category: 'unknown',
  message: 'boom',
  metadata: {},
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('SuggestionRegistry', () => {
  it('persists failures to disk and reloads them', () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-ai-'));
    const file = join(dir, 'ai-suggestions-0.json');

    const registry = new SuggestionRegistry(file);
    registry.addFailure(sampleSignal);

    const reloaded = new SuggestionRegistry(file);
    expect(reloaded.getAll()).toHaveLength(1);
    expect(reloaded.getAll()[0]?.message).toBe('boom');

    rmSync(dir, { recursive: true, force: true });
  });
});
