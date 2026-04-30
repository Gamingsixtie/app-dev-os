import { describe, it, expect } from 'vitest';
import { buildClipboardContent } from '../clipboard';
import type { ReportData } from '@/features/export/types';

// Helper to create mock ReportData
function createMockReportData(
  overrides: Partial<ReportData> = {},
): ReportData {
  return {
    schoolName: 'Dalton Lyceum',
    date: '24 maart 2026',
    selectedModules: ['lvs-vo', 'capaciteitentoets'],
    totalStudents: 450,
    comparison: {
      modules: [],
      totals: { cito: 8500, dia: 9200, jij: 10100, saqi: 0 },
      differences: {
        citoVsDia: -700,
        citoVsJij: -1600,
        citoVsSaqi: null,
      },
      diaPackageResult: null,
    },
    migration: {
      modules: [],
      totalOldCost: 12000,
      totalNewCost: 9000,
      financialDifference: 3000,
      timeSavings: [],
      totalTimeSavingsHours: 42,
      totalTimeSavingsValue: 2520,
      totalAnnualValue: 5520,
      multiYearProjection: [],
      switchingCosts: 1500,
      breakEvenMonth: 4,
    },
    priceDifference: 700,
    ...overrides,
  };
}

describe('buildClipboardContent', () => {
  it('returns plain text containing school name', () => {
    const data = createMockReportData();
    const { plain } = buildClipboardContent(data, 'generiek');
    expect(plain).toContain('Dalton Lyceum');
  });

  it('returns plain text containing "Totaalkosten per jaar" header', () => {
    const data = createMockReportData();
    const { plain } = buildClipboardContent(data, 'generiek');
    expect(plain).toContain('Totaalkosten per jaar');
  });

  it('returns plain text containing formatted EUR amounts for active providers (value > 0)', () => {
    const data = createMockReportData();
    const { plain } = buildClipboardContent(data, 'generiek');
    // Cito, DIA, JIJ have values > 0; SAQI is 0 so should NOT appear
    expect(plain).toContain('Cito:');
    expect(plain).toContain('DIA:');
    expect(plain).toContain('JIJ:');
    expect(plain).not.toContain('SAQI:');
  });

  it('returns plain text containing "Tijdwinst" and hours with migration data', () => {
    const data = createMockReportData();
    const { plain } = buildClipboardContent(data, 'generiek');
    expect(plain).toContain('Tijdwinst');
    expect(plain).toContain('42 uur/jaar');
  });

  it('returns plain text containing waarde (EUR) when totalTimeSavingsValue > 0', () => {
    const data = createMockReportData();
    const { plain } = buildClipboardContent(data, 'generiek');
    expect(plain).toContain('Waarde tijdwinst');
  });

  it('returns html string containing school name wrapped in strong tags', () => {
    const data = createMockReportData();
    const { html } = buildClipboardContent(data, 'generiek');
    expect(html).toContain('<strong>Dalton Lyceum</strong>');
  });

  it('with dmuTarget="coordinator" returns conclusion mentioning "tijdwinst"', () => {
    const data = createMockReportData();
    const { plain } = buildClipboardContent(data, 'coordinator');
    expect(plain).toMatch(/conclusie/i);
    expect(plain).toContain('tijdwinst');
  });

  it('with dmuTarget="mt" returns conclusion mentioning "strategische waarde"', () => {
    const data = createMockReportData();
    const { plain } = buildClipboardContent(data, 'mt');
    expect(plain).toMatch(/conclusie/i);
    expect(plain).toContain('strategische waarde');
  });

  it('with dmuTarget="finance" returns conclusion mentioning "financieel"', () => {
    const data = createMockReportData();
    const { plain } = buildClipboardContent(data, 'finance');
    expect(plain).toMatch(/conclusie/i);
    expect(plain).toMatch(/financieel/i);
  });

  it('with no comparison and no migration returns minimal content with school name and date', () => {
    const data = createMockReportData({
      comparison: null,
      migration: null,
      priceDifference: null,
    });
    const { plain } = buildClipboardContent(data, 'generiek');
    expect(plain).toContain('Dalton Lyceum');
    expect(plain).toContain('24 maart 2026');
    expect(plain).not.toContain('Totaalkosten per jaar');
    expect(plain).not.toContain('Tijdwinst');
  });
});
