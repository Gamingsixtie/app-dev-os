/**
 * Pure diff-computation for AI Excel-import (Phase 26-04, Task 2).
 *
 * Three responsibilities:
 *   1. `computePriceDiff(current, proposed)` — produce a flat list of DiffRow
 *      objects, one per primitive leaf. Arrays are compared opaquely (deep-equal),
 *      objects are walked recursively.
 *   2. `applyAcceptedDiff(current, diff, acceptedPaths)` — overlay `proposed`
 *      values from `diff` onto a deep clone of `current`, but only at paths the
 *      user explicitly accepted. Pure — never mutates inputs.
 *   3. `DiffRow` — view-model for the diff UI.
 *
 * Used by:
 *   - PriceImportFlow (orchestrator) — to compute the diff right after the AI call.
 *   - PriceImportDiffView (UI) — to render checkboxes per row.
 *
 * No DOM, no React. Testable as pure functions.
 */

export interface DiffRow {
  /** Dotted path into the config object, e.g. "individualPrices.rekenwiskunde". */
  path: string;
  currentValue: unknown;
  proposedValue: unknown;
  /** Convenience flag set when currentValue !== proposedValue (deep-equal for arrays). */
  changed: boolean;
}

/**
 * Deep-walk both objects in parallel; emit one DiffRow per primitive leaf.
 * - Objects are traversed key-by-key (union of keys).
 * - Arrays are treated opaquely (one DiffRow representing the whole array).
 * - At the root, if both sides are primitives the result is a single row with path '$'.
 */
export function computePriceDiff(
  current: unknown,
  proposed: unknown,
  pathPrefix = '',
): DiffRow[] {
  // Root case: at least one side is a primitive (or null).
  if (
    typeof current !== 'object' || current === null ||
    typeof proposed !== 'object' || proposed === null
  ) {
    return [
      {
        path: pathPrefix || '$',
        currentValue: current,
        proposedValue: proposed,
        changed: !deepEqual(current, proposed),
      },
    ];
  }

  // Both sides are objects (or arrays): walk recursively.
  const rows: DiffRow[] = [];
  const cur = current as Record<string, unknown>;
  const prop = proposed as Record<string, unknown>;
  const keys = new Set([...Object.keys(cur), ...Object.keys(prop)]);

  for (const key of keys) {
    const subPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    const cVal = cur[key];
    const pVal = prop[key];

    if (isPrimitive(cVal) && isPrimitive(pVal)) {
      rows.push({
        path: subPath,
        currentValue: cVal,
        proposedValue: pVal,
        changed: cVal !== pVal,
      });
    } else if (Array.isArray(cVal) || Array.isArray(pVal)) {
      // Treat arrays opaquely: one row representing the whole array.
      rows.push({
        path: subPath,
        currentValue: cVal,
        proposedValue: pVal,
        changed: !deepEqual(cVal, pVal),
      });
    } else if (cVal === undefined || pVal === undefined) {
      // One side missing the key entirely.
      rows.push({
        path: subPath,
        currentValue: cVal,
        proposedValue: pVal,
        changed: !deepEqual(cVal, pVal),
      });
    } else {
      // Both are non-array objects: recurse.
      rows.push(...computePriceDiff(cVal, pVal, subPath));
    }
  }

  return rows;
}

/**
 * Build a new object by deep-cloning `current` and overlaying `proposed` values
 * from `diff`, but ONLY at paths in `acceptedPaths`. Pure — never mutates inputs.
 *
 * Whole-array diffs are written as-is at the array path.
 */
export function applyAcceptedDiff(
  current: unknown,
  diff: DiffRow[],
  acceptedPaths: ReadonlySet<string>,
): unknown {
  // Deep clone via JSON round-trip — sufficient since pricing configs are JSON-safe.
  const result = JSON.parse(JSON.stringify(current)) as unknown;
  for (const row of diff) {
    if (!acceptedPaths.has(row.path)) continue;
    setByPath(result, row.path, row.proposedValue);
  }
  return result;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function isPrimitive(v: unknown): v is string | number | boolean | null | undefined {
  return v === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof v);
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function setByPath(obj: unknown, path: string, value: unknown): void {
  if (path === '$') {
    // Root replacement is not supported via this helper — caller must handle.
    return;
  }
  const parts = path.split('.');
  let cursor = obj as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (typeof cursor[k] !== 'object' || cursor[k] === null) {
      cursor[k] = {};
    }
    cursor = cursor[k] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}
