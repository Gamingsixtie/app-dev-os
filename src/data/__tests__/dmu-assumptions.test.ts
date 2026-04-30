import { describe, it, expect } from 'vitest';
import { DMU_ASSUMPTIONS, getDefaultAssumptions } from '../dmu-assumptions';
import type { DmuTarget } from '@/features/export/types';

describe('DMU_ASSUMPTIONS', () => {
  it('has entries for all 4 DMU targets', () => {
    const targets: DmuTarget[] = ['coordinator', 'mt', 'finance', 'generiek'];
    for (const target of targets) {
      const entry = DMU_ASSUMPTIONS.find((a) => a.dmuTarget === target);
      expect(entry, `Missing entry for ${target}`).toBeDefined();
    }
  });

  it('each entry has non-empty introText', () => {
    for (const entry of DMU_ASSUMPTIONS) {
      expect(entry.introText.length).toBeGreaterThan(0);
    }
  });

  it('each entry has non-empty focusAreas array', () => {
    for (const entry of DMU_ASSUMPTIONS) {
      expect(entry.focusAreas.length).toBeGreaterThan(0);
    }
  });

  it('each entry has editable set to true', () => {
    for (const entry of DMU_ASSUMPTIONS) {
      expect(entry.editable).toBe(true);
    }
  });

  it('each entry has a unique id', () => {
    const ids = DMU_ASSUMPTIONS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getDefaultAssumptions', () => {
  it('returns assumptions for coordinator', () => {
    const result = getDefaultAssumptions('coordinator');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((a) => a.dmuTarget === 'coordinator')).toBe(true);
  });

  it('returns assumptions for generiek', () => {
    const result = getDefaultAssumptions('generiek');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((a) => a.dmuTarget === 'generiek')).toBe(true);
  });

  it('returns assumptions for mt', () => {
    const result = getDefaultAssumptions('mt');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns assumptions for finance', () => {
    const result = getDefaultAssumptions('finance');
    expect(result.length).toBeGreaterThan(0);
  });
});
