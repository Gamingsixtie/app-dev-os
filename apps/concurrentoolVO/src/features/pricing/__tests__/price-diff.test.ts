import { describe, it, expect } from 'vitest';
import { computePriceDiff, applyAcceptedDiff } from '../import/price-diff';

describe('computePriceDiff', () => {
  it('identieke objecten leveren alleen unchanged rows (geen changed:true)', () => {
    const obj = { a: 1, b: 'x' };
    const rows = computePriceDiff(obj, obj);
    expect(rows.every((r) => r.changed === false)).toBe(true);
  });

  it('flat object met één wijziging produceert één changed row met correcte values', () => {
    const cur = { a: 1 };
    const prop = { a: 2 };
    const rows = computePriceDiff(cur, prop);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({ path: 'a', currentValue: 1, proposedValue: 2, changed: true });
  });

  it('platform+module strategy met één price-wijziging produceert exact één changed row', () => {
    const current = {
      type: 'platform+module',
      individualPrices: {
        rekenwiskunde: 7.98,
        nederlands: 7.98,
        engels: 7.98,
      },
    };
    const proposed = {
      type: 'platform+module',
      individualPrices: {
        rekenwiskunde: 8.5, // changed
        nederlands: 7.98,
        engels: 7.98,
      },
    };
    const rows = computePriceDiff(current, proposed);
    const changed = rows.filter((r) => r.changed);
    expect(changed).toHaveLength(1);
    expect(changed[0].path).toBe('individualPrices.rekenwiskunde');
    expect(changed[0].currentValue).toBe(7.98);
    expect(changed[0].proposedValue).toBe(8.5);
  });

  it('arrays worden opaak vergeleken (één row voor de hele array)', () => {
    const current = { tiers: [{ tier: 1 }, { tier: 2 }] };
    const proposed = { tiers: [{ tier: 1 }, { tier: 99 }] };
    const rows = computePriceDiff(current, proposed);
    expect(rows).toHaveLength(1);
    expect(rows[0].path).toBe('tiers');
    expect(rows[0].changed).toBe(true);
  });
});

describe('applyAcceptedDiff', () => {
  it('returns een nieuw object met alleen geaccepteerde paden bijgewerkt', () => {
    const current = {
      individualPrices: {
        rekenwiskunde: 7.98,
        nederlands: 7.98,
      },
    };
    const proposed = {
      individualPrices: {
        rekenwiskunde: 8.5,
        nederlands: 9.0,
      },
    };
    const diff = computePriceDiff(current, proposed);
    // Accept only the rekenwiskunde change.
    const accepted = new Set(['individualPrices.rekenwiskunde']);
    const result = applyAcceptedDiff(current, diff, accepted) as typeof current;
    expect(result.individualPrices.rekenwiskunde).toBe(8.5);
    expect(result.individualPrices.nederlands).toBe(7.98); // unchanged
  });

  it('muteert input-objecten NIET (deep-equality op cur/prop blijft behouden)', () => {
    const current = { individualPrices: { rekenwiskunde: 7.98 } };
    const proposed = { individualPrices: { rekenwiskunde: 8.5 } };
    const beforeCur = JSON.stringify(current);
    const beforeProp = JSON.stringify(proposed);
    const diff = computePriceDiff(current, proposed);
    applyAcceptedDiff(current, diff, new Set(['individualPrices.rekenwiskunde']));
    expect(JSON.stringify(current)).toBe(beforeCur);
    expect(JSON.stringify(proposed)).toBe(beforeProp);
  });

  it('returns een deep clone van current als geen paden geaccepteerd zijn', () => {
    const current = { a: 1, b: { c: 2 } };
    const proposed = { a: 99, b: { c: 99 } };
    const diff = computePriceDiff(current, proposed);
    const result = applyAcceptedDiff(current, diff, new Set()) as typeof current;
    expect(result).toEqual(current);
    expect(result).not.toBe(current); // new reference (deep clone)
    expect(result.b).not.toBe(current.b);
  });
});
