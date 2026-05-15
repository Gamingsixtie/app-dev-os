/**
 * Unit tests for the inline Levenshtein similarity primitive
 * (Phase 27 Plan 07, R11, D-03).
 */
import { describe, it, expect } from 'vitest';
import { similarity } from '../stringSimilarity';

describe('similarity (Wagner–Fischer Levenshtein, normalised)', () => {
  it('returns 1 for identical non-empty strings', () => {
    expect(similarity('Stichting Voortgezet Onderwijs', 'Stichting Voortgezet Onderwijs')).toBe(1);
    expect(similarity('a', 'a')).toBe(1);
  });

  it('returns 1 for two empty strings (identical by convention)', () => {
    expect(similarity('', '')).toBe(1);
  });

  it('returns 0 when one side is empty (every character is an insert)', () => {
    expect(similarity('abc', '')).toBe(0);
    expect(similarity('', 'xyz')).toBe(0);
  });

  it('returns a value strictly between 0 and 1 for partial overlap', () => {
    // "kitten" → "sitting": substitute k→s, e→i, insert g. 3 edits / 7 chars = 4/7.
    const score = similarity('kitten', 'sitting');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
    expect(score).toBeCloseTo(4 / 7, 5);
  });

  it('is case-sensitive — caller is expected to lowercase upstream', () => {
    // 'A' vs 'a' = 1 substitution / 1 char = 0 similarity.
    expect(similarity('A', 'a')).toBe(0);
    // But after caller lowercases, the same pair scores 1.
    expect(similarity('A'.toLowerCase(), 'a'.toLowerCase())).toBe(1);
  });

  it('is symmetric: similarity(a, b) === similarity(b, a)', () => {
    expect(similarity('Amsterdam', 'Amstelveen')).toBe(similarity('Amstelveen', 'Amsterdam'));
  });

  it('returns 0 when strings share no characters at all (worst case)', () => {
    // 'abc' vs 'xyz': 3 substitutions / 3 chars = 0 similarity.
    expect(similarity('abc', 'xyz')).toBe(0);
  });
});
