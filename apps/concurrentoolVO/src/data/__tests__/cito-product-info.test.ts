import { describe, it, expect } from 'vitest';
import { CITO_PRODUCT_ADVANTAGES } from '../cito-product-info';
import type { DmuTag } from '@/features/export/utils/dmu-tag-filter';

const ALL_TAGS: DmuTag[] = [
  'tijdwinst',
  'financieel',
  'strategisch',
  'dagelijks-gebruik',
  'kwaliteit',
  'compliance',
];

describe('CITO_PRODUCT_ADVANTAGES', () => {
  it('has at least 8 entries', () => {
    expect(CITO_PRODUCT_ADVANTAGES.length).toBeGreaterThanOrEqual(8);
  });

  it('covers multiple moduleIds', () => {
    const moduleIds = new Set(CITO_PRODUCT_ADVANTAGES.map((a) => a.moduleId));
    expect(moduleIds.size).toBeGreaterThanOrEqual(3);
  });

  it('every entry has non-empty advantage', () => {
    for (const entry of CITO_PRODUCT_ADVANTAGES) {
      expect(entry.advantage.length, `Empty advantage for ${entry.moduleId}`).toBeGreaterThan(0);
    }
  });

  it('every entry has non-empty context', () => {
    for (const entry of CITO_PRODUCT_ADVANTAGES) {
      expect(entry.context.length, `Empty context for ${entry.moduleId}`).toBeGreaterThan(0);
    }
  });

  it('every entry has non-empty source', () => {
    for (const entry of CITO_PRODUCT_ADVANTAGES) {
      expect(entry.source.length, `Empty source for ${entry.moduleId}`).toBeGreaterThan(0);
    }
  });

  it('every entry has at least one tag', () => {
    for (const entry of CITO_PRODUCT_ADVANTAGES) {
      expect(entry.tags.length, `No tags for ${entry.moduleId}`).toBeGreaterThan(0);
    }
  });

  it('every tag is a valid DmuTag value', () => {
    for (const entry of CITO_PRODUCT_ADVANTAGES) {
      for (const tag of entry.tags) {
        expect(ALL_TAGS, `Invalid tag "${tag}" in ${entry.moduleId}`).toContain(tag);
      }
    }
  });
});
