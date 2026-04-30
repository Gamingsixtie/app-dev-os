export type AIProvider = 'anthropic';

export interface ModelConfig {
  provider: AIProvider;
  model: string;
  maxTokensSummary: number;
  maxTokensAnalysis: number;
}

const DEFAULT_CONFIG: ModelConfig = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  maxTokensSummary: 2048,
  maxTokensAnalysis: 4096,
};

export function getModelConfig(): ModelConfig {
  return {
    ...DEFAULT_CONFIG,
    model: process.env.SCHOOLPLAN_AI_MODEL || DEFAULT_CONFIG.model,
  };
}
