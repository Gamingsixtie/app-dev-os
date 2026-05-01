import { describe, it, expect, afterEach } from 'vitest';
import { getModelConfig } from '../ai-model-config';

describe('getModelConfig', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns default model config', () => {
    const config = getModelConfig();

    expect(config.provider).toBe('anthropic');
    expect(config.model).toBeTruthy();
    expect(config.maxTokensSummary).toBe(2048);
    expect(config.maxTokensAnalysis).toBe(4096);
  });

  it('uses SCHOOLPLAN_AI_MODEL env var when set', () => {
    process.env = { ...originalEnv, SCHOOLPLAN_AI_MODEL: 'custom-model' };

    const config = getModelConfig();

    expect(config.model).toBe('custom-model');
  });

  it('falls back to default model when env var is empty', () => {
    process.env = { ...originalEnv, SCHOOLPLAN_AI_MODEL: '' };

    const config = getModelConfig();

    // Empty string is falsy, so default is used
    expect(config.model).toBeTruthy();
    expect(config.model).not.toBe('');
  });
});
