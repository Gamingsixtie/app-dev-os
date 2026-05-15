/**
 * Smart-suggestion matcher for the Stichting bulk-link flow (Phase 27 Plan 07,
 * R11, D-03).
 *
 * Pure function: given a target `Stichting` and a list of `SchoolRecord`s,
 * returns a sorted list of `MatchSuggestion`s for the schools that don't have
 * a `stichtingId` yet and that score above the minimum threshold.
 *
 * Scoring heuristic (D-03 weights, calibratable):
 *   - `NAAM_WEIGHT` × Levenshtein-similarity(stichting.name, school.name)
 *   - +`REGIO_WEIGHT` if both `region` fields are non-empty AND match case-insensitively
 *
 * The `preChecked` flag is `true` when the combined score exceeds
 * `PRE_CHECKED_THRESHOLD` (0.8). Suggestions with `score < MIN_SCORE_SUGGESTED`
 * (0.6) are dropped entirely so the UI doesn't show low-confidence noise.
 *
 * Schools already linked to any Stichting are filtered out — bulk-link should
 * never silently re-route a school. Use `unlinkSchoolFromStichting` first if
 * the school needs to be moved.
 */

import type { SchoolRecord } from '@/db/types';
import type { StichtingRecord } from '@/models/stichting';
import { similarity } from './stringSimilarity';

/** Weight for naam-similarity contribution to the score. */
export const NAAM_WEIGHT = 0.65;

/** Weight for regio-match contribution to the score. */
export const REGIO_WEIGHT = 0.35;

/**
 * Minimum score for a school to appear as a suggestion. Below this we hide
 * the school from the suggestion section — sales can still add it via the
 * "Handmatig toevoegen" section in the dialog.
 */
export const MIN_SCORE_SUGGESTED = 0.6;

/**
 * Score above which the suggestion is auto-checked in the dialog. Sales can
 * still uncheck it manually; we just guess "yes" by default.
 */
export const PRE_CHECKED_THRESHOLD = 0.8;

export interface MatchSuggestion {
  /** School UUID. */
  schoolId: string;
  /** School display name (for UI rendering — avoids re-lookup). */
  schoolName: string;
  /** Combined score in [0, 1]. */
  score: number;
  /** True when `score > PRE_CHECKED_THRESHOLD` — UI starts checkbox checked. */
  preChecked: boolean;
  /** Human-readable reasons (Dutch) for the score, surfaced in a tooltip. */
  reasons: string[];
}

/**
 * Suggest schools to link to a given Stichting based on naam + regio
 * heuristics.
 *
 * Returns suggestions sorted by `score` descending. Schools already linked
 * (`stichtingId != null`) are excluded. Schools that score below the
 * `MIN_SCORE_SUGGESTED` floor are excluded.
 *
 * The function is deterministic and side-effect-free; safe to memoise.
 */
export function suggestSchoolsForStichting(
  stichting: Pick<StichtingRecord, 'name' | 'region'>,
  schools: SchoolRecord[],
): MatchSuggestion[] {
  const stichtingName = stichting.name.toLowerCase().trim();
  const stichtingRegion = (stichting.region ?? '').toLowerCase().trim();

  return schools
    .filter((s) => !s.stichtingId)
    .map<MatchSuggestion>((s) => {
      const reasons: string[] = [];
      let score = 0;

      // --- Naam-similarity (Levenshtein, weighted) ---
      const schoolName = (s.name ?? '').toLowerCase().trim();
      const nameSim = similarity(stichtingName, schoolName);
      score += nameSim * NAAM_WEIGHT;
      if (nameSim >= 0.6) {
        reasons.push(`naam-similarity ${nameSim.toFixed(2)}`);
      }

      // --- Regio-match (bonus, only when BOTH sides have a regio) ---
      const schoolRegion = (s.region ?? '').toLowerCase().trim();
      if (stichtingRegion.length > 0 && schoolRegion.length > 0 && stichtingRegion === schoolRegion) {
        score += REGIO_WEIGHT;
        reasons.push('regio-match');
      }

      return {
        schoolId: s.id,
        schoolName: s.name,
        score,
        preChecked: score > PRE_CHECKED_THRESHOLD,
        reasons,
      };
    })
    .filter((suggestion) => suggestion.score >= MIN_SCORE_SUGGESTED)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tie-break on schoolName to keep ordering deterministic for tests.
      return a.schoolName.localeCompare(b.schoolName, 'nl');
    });
}
