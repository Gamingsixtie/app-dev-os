/**
 * Phase 27 Wave 0 scaffold — R9 AI-driven pijnpunt matcher.
 *
 * Skeleton placeholders for the AI matcher that runs in parallel with
 * the rule-based fallback. Uses a mocked Anthropic client to keep the
 * unit test deterministic and offline. Implementation lands in
 * Plan 27-08.
 */
import { describe, it } from 'vitest';

describe('matchPijnpuntWithAI (R9 AI-mocked)', () => {
  it.todo('mocks @anthropic-ai/sdk and returns a Zod-validated response shape');

  it.todo('parses a valid AI response into MatchedVoordeel[] without throwing');

  it.todo('times out after 5 seconds and falls back to the rule-based result');

  it.todo('falls back to rule-based matching when the AI call errors');

  it.todo('preserves the consultant-entered free-form pijnpunt verbatim in the prompt');
});
