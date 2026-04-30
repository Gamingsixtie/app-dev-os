import { describe, it, expect } from 'vitest';
import {
  type DmuTag,
  DMU_TAG_MAP,
  filterByDmuTags,
  tagSchoolplanOpportunity,
} from '../dmu-tag-filter';

// Helper to create tagged items
function makeItem(tags: DmuTag[]) {
  return { tags, label: 'test' };
}

describe('DMU_TAG_MAP', () => {
  it('has entries for all 4 DMU targets', () => {
    expect(DMU_TAG_MAP).toHaveProperty('coordinator');
    expect(DMU_TAG_MAP).toHaveProperty('mt');
    expect(DMU_TAG_MAP).toHaveProperty('finance');
    expect(DMU_TAG_MAP).toHaveProperty('generiek');
  });

  it('generiek includes all 6 tags', () => {
    expect(DMU_TAG_MAP.generiek).toHaveLength(6);
  });
});

describe('filterByDmuTags', () => {
  const items = [
    makeItem(['tijdwinst']),
    makeItem(['financieel']),
    makeItem(['strategisch']),
    makeItem(['dagelijks-gebruik']),
    makeItem(['kwaliteit']),
    makeItem(['compliance']),
    makeItem(['tijdwinst', 'financieel']),
  ];

  it('coordinator returns items tagged with tijdwinst, dagelijks-gebruik, or kwaliteit', () => {
    const result = filterByDmuTags(items, 'coordinator');
    expect(result).toHaveLength(4); // tijdwinst, dagelijks-gebruik, kwaliteit, tijdwinst+financieel
    expect(result.every((r) => r.tags.some((t) => DMU_TAG_MAP.coordinator.includes(t)))).toBe(true);
  });

  it('mt returns items tagged with strategisch, kwaliteit, or compliance', () => {
    const result = filterByDmuTags(items, 'mt');
    expect(result).toHaveLength(3); // strategisch, kwaliteit, compliance
    expect(result.every((r) => r.tags.some((t) => DMU_TAG_MAP.mt.includes(t)))).toBe(true);
  });

  it('finance returns items tagged with financieel or tijdwinst', () => {
    const result = filterByDmuTags(items, 'finance');
    expect(result).toHaveLength(3); // tijdwinst, financieel, tijdwinst+financieel
    expect(result.every((r) => r.tags.some((t) => DMU_TAG_MAP.finance.includes(t)))).toBe(true);
  });

  it('generiek returns all items', () => {
    const result = filterByDmuTags(items, 'generiek');
    expect(result).toHaveLength(items.length);
  });

  it('returns empty array when no items match', () => {
    const onlyCompliance = [makeItem(['compliance'])];
    const result = filterByDmuTags(onlyCompliance, 'finance');
    expect(result).toHaveLength(0);
  });
});

describe('tagSchoolplanOpportunity', () => {
  it('returns tijdwinst for text containing "tijd"', () => {
    const tags = tagSchoolplanOpportunity({ theme: 'Tijdwinst', explanation: 'bla' });
    expect(tags).toContain('tijdwinst');
  });

  it('returns tijdwinst for text containing "effici"', () => {
    const tags = tagSchoolplanOpportunity({ theme: 'Efficiency', explanation: 'bla' });
    expect(tags).toContain('tijdwinst');
  });

  it('returns financieel for text containing "kosten"', () => {
    const tags = tagSchoolplanOpportunity({ theme: 'bla', explanation: 'lagere kosten' });
    expect(tags).toContain('financieel');
  });

  it('returns financieel for text containing "besparing"', () => {
    const tags = tagSchoolplanOpportunity({ theme: 'bla', explanation: 'besparing mogelijk' });
    expect(tags).toContain('financieel');
  });

  it('returns strategisch for text containing "visie"', () => {
    const tags = tagSchoolplanOpportunity({ theme: 'Schoolvisie', explanation: 'bla' });
    expect(tags).toContain('strategisch');
  });

  it('returns strategisch for text containing "toekomst"', () => {
    const tags = tagSchoolplanOpportunity({ theme: 'bla', explanation: 'toekomstbestendig' });
    expect(tags).toContain('strategisch');
  });

  it('returns dagelijks-gebruik for text containing "docent"', () => {
    const tags = tagSchoolplanOpportunity({ theme: 'bla', explanation: 'docenten werken hiermee' });
    expect(tags).toContain('dagelijks-gebruik');
  });

  it('returns kwaliteit for text containing "kwaliteit"', () => {
    const tags = tagSchoolplanOpportunity({ theme: 'Toetskwaliteit', explanation: 'bla' });
    expect(tags).toContain('kwaliteit');
  });

  it('returns kwaliteit for text containing "betrouwbaar"', () => {
    const tags = tagSchoolplanOpportunity({ theme: 'bla', explanation: 'betrouwbare resultaten' });
    expect(tags).toContain('kwaliteit');
  });

  it('returns default tags when no keywords match', () => {
    const tags = tagSchoolplanOpportunity({ theme: 'xyz', explanation: 'abc' });
    expect(tags).toEqual(['tijdwinst', 'financieel', 'strategisch']);
  });
});
