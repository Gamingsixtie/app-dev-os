/**
 * Phase 27 Plan 02 — R1 Stichting CRUD.
 *
 * Wave 0 (Plan 27-01) scaffolded this file with 12 it.todo entries. Plan
 * 27-02 (this commit) lands the cascade-guard model and replaces the
 * todos that can be exercised without a Supabase mock with real
 * assertions; the Supabase-flow tests remain todo until Plan 27-03/04
 * brings in a proper Supabase test harness.
 */
import { describe, it, expect } from 'vitest';
import {
  StichtingCascadeError,
  getStichtingUsageMix,
  STICHTING_USAGE_MIX_LABELS,
  STICHTING_USAGE_MIX_COLORS,
} from '@/models/stichting';
import type { SchoolRecord } from '@/db/types';

describe('Stichting operations (R1)', () => {
  describe('StichtingCascadeError (D-04)', () => {
    it('carries the stichtingId and linked-school count on the error instance', () => {
      const err = new StichtingCascadeError('stichting-abc', 3);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('StichtingCascadeError');
      expect(err.stichtingId).toBe('stichting-abc');
      expect(err.linkedSchoolCount).toBe(3);
    });

    it('renders a Dutch error message with singular vs plural school count', () => {
      const singular = new StichtingCascadeError('s-1', 1);
      const plural = new StichtingCascadeError('s-2', 4);
      expect(singular.message).toContain('1 school nog gekoppeld');
      expect(plural.message).toContain('4 scholen nog gekoppeld');
    });
  });

  describe('getStichtingUsageMix', () => {
    it('returns "unknown" when no schools are linked (empty array)', () => {
      expect(getStichtingUsageMix([])).toBe('unknown');
    });

    it('returns "unknown" for schools with no currentToolUsage map', () => {
      // Minimal stub schools — pre-Plan 27-05 shape (no currentToolUsage).
      const schools = [
        { id: 's1' } as unknown as SchoolRecord,
        { id: 's2' } as unknown as SchoolRecord,
      ];
      expect(getStichtingUsageMix(schools)).toBe('unknown');
    });

    // Phase 27 Plan 05 (R5) — real aggregation behaviour
    it('returns "cito-only" when every recorded niveau across schools is Cito', () => {
      const schools = [
        { id: 's1', currentToolUsage: { havo: 'cito', vwo: 'cito' } },
        { id: 's2', currentToolUsage: { 'vmbo-gt': 'cito' } },
      ] as unknown as SchoolRecord[];
      expect(getStichtingUsageMix(schools)).toBe('cito-only');
    });

    it('returns "concurrent-only" when every recorded niveau is dia/jij/geen', () => {
      const schools = [
        { id: 's1', currentToolUsage: { havo: 'dia', vwo: 'jij' } },
        { id: 's2', currentToolUsage: { 'vmbo-gt': 'geen' } },
      ] as unknown as SchoolRecord[];
      expect(getStichtingUsageMix(schools)).toBe('concurrent-only');
    });

    it('returns "mixed" when Cito and concurrent both appear across schools', () => {
      const schools = [
        { id: 's1', currentToolUsage: { havo: 'cito' } },
        { id: 's2', currentToolUsage: { havo: 'dia' } },
      ] as unknown as SchoolRecord[];
      expect(getStichtingUsageMix(schools)).toBe('mixed');
    });

    it('returns "mixed" immediately when any per-niveau value is "mix"', () => {
      const schools = [
        { id: 's1', currentToolUsage: { havo: 'cito' } },
        { id: 's2', currentToolUsage: { vwo: 'mix' } },
      ] as unknown as SchoolRecord[];
      expect(getStichtingUsageMix(schools)).toBe('mixed');
    });

    it('returns "unknown" when all currentToolUsage maps are empty objects', () => {
      const schools = [
        { id: 's1', currentToolUsage: {} },
        { id: 's2', currentToolUsage: {} },
      ] as unknown as SchoolRecord[];
      expect(getStichtingUsageMix(schools)).toBe('unknown');
    });
  });

  describe('STICHTING_USAGE_MIX_LABELS + COLORS', () => {
    it('provides a Dutch label and a Tailwind colour for every UsageMix variant', () => {
      for (const key of ['cito-only', 'concurrent-only', 'mixed', 'unknown'] as const) {
        expect(STICHTING_USAGE_MIX_LABELS[key]).toBeTruthy();
        expect(STICHTING_USAGE_MIX_COLORS[key]).toMatch(/^bg-/);
      }
    });
  });

  describe('createStichting', () => {
    it.todo('inserts a new stichting row with generated UUID');
    it.todo('rejects creation when naam is empty');
    it.todo('persists optional fields (regio, adres) when provided');
  });

  describe('updateStichting', () => {
    it.todo('updates editable fields and bumps updatedAt');
    it.todo('rejects update when stichting does not exist');
  });

  describe('deleteStichting', () => {
    it.todo('refuses delete when scholen are still linked (cascade-guard)');
    it.todo('allows delete after all schools are unlinked');
  });

  describe('linkSchoolToStichting', () => {
    it.todo('attaches stichtingId to the school record');
    it.todo('replaces an existing stichtingId without orphaning the previous link');
  });

  describe('unlinkSchoolFromStichting', () => {
    it.todo('clears stichtingId on the school record');
  });

  describe('bulkLinkSchools', () => {
    it.todo('links N schools to one stichting in a single transaction');
    it.todo('rolls back when one of the schools is invalid');
  });
});
