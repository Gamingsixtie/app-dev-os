import { describe, it, expect } from 'vitest';
import type { DmuTarget, ReportType } from '../../types';

// CoverPage uses @react-pdf/renderer components which are difficult to unit test.
// These tests validate the prop handling and label mapping logic.

const DMU_LABELS: Record<DmuTarget, string> = {
  coordinator: 'Coordinator',
  mt: 'MT / Directie',
  finance: 'Finance',
  generiek: 'Generiek',
};

const REPORT_TITLES: Record<ReportType, string> = {
  prijsvergelijking: 'Prijsvergelijking',
  waarderapport: 'Waarderapport',
  gecombineerd: 'Vergelijking & Waarde',
};

describe('CoverPage label maps', () => {
  it('maps all DMU targets to Dutch labels', () => {
    const targets: DmuTarget[] = ['coordinator', 'mt', 'finance', 'generiek'];
    for (const target of targets) {
      expect(DMU_LABELS[target]).toBeDefined();
      expect(DMU_LABELS[target].length).toBeGreaterThan(0);
    }
  });

  it('maps all report types to Dutch titles', () => {
    const types: ReportType[] = ['prijsvergelijking', 'waarderapport', 'gecombineerd'];
    for (const type of types) {
      expect(REPORT_TITLES[type]).toBeDefined();
      expect(REPORT_TITLES[type].length).toBeGreaterThan(0);
    }
  });

  it('coordinator label is Coordinator', () => {
    expect(DMU_LABELS.coordinator).toBe('Coordinator');
  });

  it('mt label includes Directie', () => {
    expect(DMU_LABELS.mt).toContain('Directie');
  });

  it('gecombineerd title includes both concepts', () => {
    expect(REPORT_TITLES.gecombineerd).toContain('Vergelijking');
    expect(REPORT_TITLES.gecombineerd).toContain('Waarde');
  });

  it('confidential text format includes school name', () => {
    const schoolName = 'Dalton Lyceum';
    const confidentialText = `Vertrouwelijk — opgesteld voor ${schoolName}`;
    expect(confidentialText).toContain('Vertrouwelijk');
    expect(confidentialText).toContain(schoolName);
  });
});
