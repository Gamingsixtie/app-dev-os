/**
 * Inline Levenshtein-based string similarity (Phase 27 Plan 07, R11, D-03).
 *
 * Pure functions, no external dependencies — chosen over the `string-similarity`
 * npm package per Phase 22 deps-policy (the package is ~5 KB extra bundle for
 * something that fits in ~50 LOC).
 *
 * Algorithm: Wagner–Fischer dynamic programming (public domain). Computes the
 * minimum edit distance (insert / delete / substitute) between two strings,
 * then normalises against the longer string length so the result is in [0, 1]:
 *
 *   similarity = (longer.length - levenshtein(a, b)) / longer.length
 *
 * Caller is responsible for case-folding and trimming — the implementation is
 * intentionally case-sensitive so the same primitive can be used in places
 * that need exact-case matching (e.g. acronym preservation).
 *
 * Complexity: O(|a| * |b|) time and space. With names capped at 100 chars
 * (Stichting + School name DB constraints) the worst case is ~10 K operations
 * per pair, which is comfortably below the DoS threshold from the threat
 * model (T-27-07-01).
 */

/**
 * Wagner–Fischer Levenshtein edit distance.
 *
 * Returns the minimum number of single-character edits (insertions, deletions,
 * or substitutions) required to transform `a` into `b`.
 *
 * @internal
 */
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // matrix[i][j] = edit distance between b[0..i) and a[0..j)
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitute
          matrix[i][j - 1] + 1,     // insert
          matrix[i - 1][j] + 1,     // delete
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * String similarity in [0, 1] derived from Levenshtein edit distance.
 *
 * - `similarity(a, a) === 1` for any non-empty string.
 * - `similarity('', '') === 1` by convention (two empty strings are identical).
 * - `similarity(a, '') === 0` (and symmetric) — every character of `a` needs
 *   to be inserted, so the distance equals the length of the longer side.
 * - Case-sensitive — call `.toLowerCase()` upstream if needed.
 */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  if (longer.length === 0) return 1;
  return (longer.length - levenshtein(a, b)) / longer.length;
}
