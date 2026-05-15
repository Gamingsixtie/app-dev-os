/**
 * Unit tests for `suggestSchoolsForStichting` — the D-03 smart-suggestion
 * heuristic that drives the bulk-link dialog in Plan 27-07 (R11).
 *
 * Scaffolded as `it.todo`s in Plan 27-01; turned green in Plan 27-07.
 */
import { describe, it, expect } from 'vitest';
import {
  MIN_SCORE_SUGGESTED,
  PRE_CHECKED_THRESHOLD,
  REGIO_WEIGHT,
  suggestSchoolsForStichting,
} from '../stichtingMatcher';
import type { SchoolRecord } from '@/db/types';
import type { StichtingRecord } from '@/models/stichting';

// --- Test helpers ----------------------------------------------------------

function makeSchool(overrides: Partial<SchoolRecord> & Pick<SchoolRecord, 'id' | 'name'>): SchoolRecord {
  return {
    id: overrides.id,
    slug: overrides.slug ?? overrides.id,
    name: overrides.name,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isComplete: false,
    completedSteps: [],
    levels: [],
    studentCounts: {},
    selectedModules: [],
    moduleSetups: [],
    scenario: null,
    appliedOverrides: [],
    migrationHourlyRate: null,
    migrationTimeSavingOverrides: {},
    switchingCosts: 0,
    contacts: [],
    conversations: [],
    actions: [],
    systemEvents: [],
    pipelineStatus: 'prospect',
    region: '',
    tags: [],
    viewPreference: 'compact',
    stichtingId: null,
    ...overrides,
  } as SchoolRecord;
}

function makeStichting(name: string, region = ''): Pick<StichtingRecord, 'name' | 'region'> {
  return { name, region };
}

// --- Tests -----------------------------------------------------------------

describe('stichtingMatcher (D-03)', () => {
  it('returns an empty list when there are no ongekoppelde schools', () => {
    const stichting = makeStichting('Stichting Voortgezet Onderwijs Amsterdam', 'Noord-Holland');
    const schools = [
      makeSchool({ id: 's1', name: 'Stichting Voortgezet Onderwijs Amsterdam', stichtingId: 'other-stichting' }),
    ];
    const result = suggestSchoolsForStichting(stichting, schools);
    expect(result).toEqual([]);
  });

  it('produces an exact match with score 1 and preChecked=true when names are identical', () => {
    const stichting = makeStichting('VO Amsterdam');
    const schools = [makeSchool({ id: 's1', name: 'VO Amsterdam' })];
    const [match] = suggestSchoolsForStichting(stichting, schools);
    expect(match).toBeDefined();
    // Name-only contribution = 1 * NAAM_WEIGHT = 0.65 (no regio match without both fields)
    expect(match.score).toBeCloseTo(0.65, 5);
    expect(match.preChecked).toBe(false);
    expect(match.reasons).toContain('naam-similarity 1.00');
  });

  it('adds REGIO_WEIGHT (0.35) on a case-insensitive regio match — and crosses preChecked', () => {
    const stichting = makeStichting('VO Amsterdam', 'Noord-Holland');
    const schools = [
      makeSchool({ id: 's1', name: 'VO Amsterdam', region: 'noord-holland' }),
    ];
    const [match] = suggestSchoolsForStichting(stichting, schools);
    expect(match.score).toBeCloseTo(0.65 + REGIO_WEIGHT, 5); // 1.0
    expect(match.preChecked).toBe(true);
    expect(match.reasons).toContain('regio-match');
  });

  it('filters out schools whose combined score is below the MIN_SCORE_SUGGESTED floor', () => {
    const stichting = makeStichting('Stichting Alpha');
    const schools = [
      // 'Beta School' shares nothing with 'Stichting Alpha' — score well below 0.6.
      makeSchool({ id: 's1', name: 'Beta School' }),
    ];
    const result = suggestSchoolsForStichting(stichting, schools);
    expect(result).toEqual([]);
  });

  it('handles a missing regio field gracefully without throwing or producing NaN', () => {
    const stichting = makeStichting('VO Amsterdam', ''); // empty regio on stichting
    const schools = [
      makeSchool({ id: 's1', name: 'VO Amsterdam', region: '' }), // empty regio on school
    ];
    const [match] = suggestSchoolsForStichting(stichting, schools);
    expect(match).toBeDefined();
    expect(Number.isNaN(match.score)).toBe(false);
    // Regio bonus should NOT apply when either side is empty.
    expect(match.reasons).not.toContain('regio-match');
    expect(match.score).toBeCloseTo(0.65, 5);
  });

  it('sorts suggestions by score descending', () => {
    const stichting = makeStichting('VO Amsterdam', 'Noord-Holland');
    const schools = [
      // Lower score: name-only (no regio match).
      makeSchool({ id: 's1', name: 'VO Amsterdam', region: 'Utrecht' }),
      // Higher score: name + regio.
      makeSchool({ id: 's2', name: 'VO Amsterdam', region: 'Noord-Holland' }),
    ];
    const result = suggestSchoolsForStichting(stichting, schools);
    expect(result.map((s) => s.schoolId)).toEqual(['s2', 's1']);
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('excludes schools that are already linked to ANY stichting', () => {
    const stichting = makeStichting('VO Amsterdam', 'Noord-Holland');
    const schools = [
      makeSchool({ id: 's1', name: 'VO Amsterdam', region: 'Noord-Holland', stichtingId: 'other' }),
      makeSchool({ id: 's2', name: 'VO Amsterdam', region: 'Noord-Holland', stichtingId: null }),
    ];
    const result = suggestSchoolsForStichting(stichting, schools);
    expect(result.map((s) => s.schoolId)).toEqual(['s2']);
  });

  it('is deterministic — same inputs always produce the same ordering', () => {
    const stichting = makeStichting('VO Amsterdam', 'Noord-Holland');
    const schools = [
      makeSchool({ id: 's1', name: 'VO Amsterdam', region: 'Noord-Holland' }),
      makeSchool({ id: 's2', name: 'VO Amsterdam', region: 'Noord-Holland' }), // identical score → tie-break on name
    ];
    const a = suggestSchoolsForStichting(stichting, schools);
    const b = suggestSchoolsForStichting(stichting, schools);
    expect(a).toEqual(b);
  });

  it('preChecked is true ONLY when score crosses the PRE_CHECKED_THRESHOLD', () => {
    // Sanity-check the threshold contract: a score just above 0.8 → preChecked true;
    // just below → false. We construct that via name + regio match for true, name
    // alone (score = 0.65) for false.
    const stichting = makeStichting('VO Amsterdam', 'Noord-Holland');
    const schools = [
      makeSchool({ id: 'high', name: 'VO Amsterdam', region: 'Noord-Holland' }),
      makeSchool({ id: 'low', name: 'VO Amsterdam' }),
    ];
    const result = suggestSchoolsForStichting(stichting, schools);
    const high = result.find((r) => r.schoolId === 'high');
    const low = result.find((r) => r.schoolId === 'low');
    expect(high?.score).toBeGreaterThan(PRE_CHECKED_THRESHOLD);
    expect(high?.preChecked).toBe(true);
    expect(low?.score).toBeLessThanOrEqual(PRE_CHECKED_THRESHOLD);
    expect(low?.preChecked).toBe(false);
  });

  it('honours the MIN_SCORE_SUGGESTED export — schools at or above the floor survive', () => {
    // An exact-name match yields 0.65 ≥ MIN_SCORE_SUGGESTED (0.6) → kept.
    const stichting = makeStichting('Stichting Alpha');
    const schools = [makeSchool({ id: 's1', name: 'Stichting Alpha' })];
    const result = suggestSchoolsForStichting(stichting, schools);
    expect(result).toHaveLength(1);
    expect(result[0].score).toBeGreaterThanOrEqual(MIN_SCORE_SUGGESTED);
  });
});
