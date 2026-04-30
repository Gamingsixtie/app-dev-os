import { describe, it, expect } from 'vitest';
import { getReportSections } from '../dmu-filters';

describe('getReportSections', () => {
  describe('coordinator target', () => {
    it('returns practical summaryFocus', () => {
      const result = getReportSections('gecombineerd', 'coordinator');
      expect(result.summaryFocus).toBe('practical');
    });

    it('orders timeSavings before priceComparison', () => {
      const result = getReportSections('gecombineerd', 'coordinator');
      const tsIdx = result.sections.indexOf('timeSavings');
      const pcIdx = result.sections.indexOf('priceComparison');
      expect(tsIdx).toBeLessThan(pcIdx);
    });

    it('starts with summary', () => {
      const result = getReportSections('gecombineerd', 'coordinator');
      expect(result.sections[0]).toBe('summary');
    });
  });

  describe('mt target', () => {
    it('returns strategic summaryFocus', () => {
      const result = getReportSections('gecombineerd', 'mt');
      expect(result.summaryFocus).toBe('strategic');
    });

    it('orders multiYear first after summary', () => {
      const result = getReportSections('gecombineerd', 'mt');
      expect(result.sections[1]).toBe('multiYear');
    });
  });

  describe('finance target', () => {
    it('returns financial summaryFocus', () => {
      const result = getReportSections('gecombineerd', 'finance');
      expect(result.summaryFocus).toBe('financial');
    });

    it('orders priceComparison first after summary', () => {
      const result = getReportSections('gecombineerd', 'finance');
      expect(result.sections[1]).toBe('priceComparison');
    });
  });

  describe('generiek target', () => {
    it('returns balanced summaryFocus', () => {
      const result = getReportSections('gecombineerd', 'generiek');
      expect(result.summaryFocus).toBe('balanced');
    });

    it('uses default section order', () => {
      const result = getReportSections('gecombineerd', 'generiek');
      expect(result.sections).toEqual([
        'summary',
        'priceComparison',
        'timeSavings',
        'migration',
        'multiYear',
        'differentiators',
        'schoolplan',
      ]);
    });
  });

  describe('prijsvergelijking report type', () => {
    it('only includes price-related sections', () => {
      const result = getReportSections('prijsvergelijking', 'generiek');
      expect(result.sections).toContain('summary');
      expect(result.sections).toContain('priceComparison');
      expect(result.sections).toContain('differentiators');
      expect(result.sections).not.toContain('timeSavings');
      expect(result.sections).not.toContain('migration');
      expect(result.sections).not.toContain('multiYear');
    });
  });
});
