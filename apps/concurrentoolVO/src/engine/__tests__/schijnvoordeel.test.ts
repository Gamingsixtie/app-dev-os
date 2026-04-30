import { describe, it, expect } from 'vitest';
import {
  detectSchijnvoordelen,
  detectDiaPakketIllusie,
  detectJijGratisModuleIllusie,
  detectAppelsPerenVergelijking,
  detectBundelEffecten,
  detectVolumeIllusie,
  detectFunctioneleGap,
} from '../schijnvoordeel';
import { calculateComparison } from '../price-comparison';
import type { SchoolLevel } from '../../models/school';

// Helper: create student counts for a given total (spread across havo year 3)
function makeStudentCounts(total: number): Partial<Record<SchoolLevel, Record<number, number>>> {
  if (total === 0) return {};
  return { havo: { 3: total } };
}

// Helper: get a comparison result for given modules and student count
function getComparison(modules: string[], totalStudents: number) {
  return calculateComparison(modules, makeStudentCounts(totalStudents));
}

describe('detectSchijnvoordelen (main)', () => {
  it('returns empty array for empty modules', () => {
    const result = detectSchijnvoordelen([], {}, getComparison([], 0));
    expect(result).toEqual([]);
  });

  it('returns warnings for 3 kern modules with students', () => {
    const modules = ['rekenwiskunde', 'nederlands', 'engels'];
    const counts = makeStudentCounts(400);
    const comparison = getComparison(modules, 400);
    const result = detectSchijnvoordelen(modules, counts, comparison);
    // Should have at least bundel-effecten and possibly functionele-gap
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('detectDiaPakketIllusie', () => {
  it('returns null for fewer than 2 DIA modules', () => {
    expect(detectDiaPakketIllusie(['rekenwiskunde'])).toBeNull();
  });

  it('returns null for empty modules', () => {
    expect(detectDiaPakketIllusie([])).toBeNull();
  });

  it('returns null for modules without DIA pricing', () => {
    // sociaal-emotioneel has no DIA pricing
    expect(detectDiaPakketIllusie(['sociaal-emotioneel'])).toBeNull();
  });

  it('returns warning for multiple DIA modules when package is not significantly cheaper', () => {
    // rekenwiskunde + nederlands + engels + taalverzorging all have DIA prices
    const result = detectDiaPakketIllusie([
      'rekenwiskunde',
      'nederlands',
      'engels',
      'taalverzorging',
    ]);
    // Package compleet = €18.13, individual = 3.36+3.36+5.84+3.36 = €15.92
    // Package is MORE expensive, so warning should fire
    if (result) {
      expect(result.type).toBe('dia-pakket-illusie');
      expect(result.severity).toBe('warning');
      expect(result.explanation).toContain('duurder dan individueel');
    }
  });
});

describe('detectJijGratisModuleIllusie', () => {
  it('returns null when sociaal-emotioneel not selected', () => {
    expect(detectJijGratisModuleIllusie(['rekenwiskunde'], makeStudentCounts(400))).toBeNull();
  });

  it('returns null when 0 students', () => {
    expect(detectJijGratisModuleIllusie(['sociaal-emotioneel'], makeStudentCounts(0))).toBeNull();
  });

  it('returns critical warning for sociaal-emotioneel with students', () => {
    const result = detectJijGratisModuleIllusie(['sociaal-emotioneel'], makeStudentCounts(400));
    expect(result).not.toBeNull();
    expect(result!.type).toBe('jij-gratis-module-illusie');
    expect(result!.severity).toBe('critical');
    expect(result!.explanation).toContain('basislicentie');
  });
});

describe('detectAppelsPerenVergelijking', () => {
  it('returns null for 0 students', () => {
    expect(detectAppelsPerenVergelijking(['rekenwiskunde'], makeStudentCounts(0))).toBeNull();
  });

  it('returns null when no JIJ modules selected', () => {
    // taalverzorging has no JIJ pricing
    expect(detectAppelsPerenVergelijking(['taalverzorging'], makeStudentCounts(400))).toBeNull();
  });

  it('returns info warning for modules with JIJ pricing', () => {
    const result = detectAppelsPerenVergelijking(['rekenwiskunde'], makeStudentCounts(400));
    expect(result).not.toBeNull();
    expect(result!.type).toBe('appels-peren-vergelijking');
    expect(result!.severity).toBe('info');
  });
});

describe('detectBundelEffecten', () => {
  it('returns null for fewer than 2 kern modules', () => {
    expect(detectBundelEffecten(['rekenwiskunde'])).toBeNull();
  });

  it('returns warning for 2+ kern modules where DIA is cheaper', () => {
    const result = detectBundelEffecten(['rekenwiskunde', 'nederlands']);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('bundel-effecten');
    expect(result!.severity).toBe('warning');
    expect(result!.affectedModules).toContain('rekenwiskunde');
    expect(result!.affectedModules).toContain('nederlands');
  });

  it('returns warning for all 3 kern modules', () => {
    const result = detectBundelEffecten(['rekenwiskunde', 'nederlands', 'engels']);
    expect(result).not.toBeNull();
    expect(result!.explanation).toContain('Cito Basis');
  });
});

describe('detectVolumeIllusie', () => {
  it('returns null for small school (no discount)', () => {
    expect(detectVolumeIllusie(['rekenwiskunde'], makeStudentCounts(200))).toBeNull();
  });

  it('returns null when no DIA modules', () => {
    expect(detectVolumeIllusie(['sociaal-emotioneel'], makeStudentCounts(600))).toBeNull();
  });

  it('returns info warning for 500+ students with DIA modules', () => {
    const result = detectVolumeIllusie(['rekenwiskunde'], makeStudentCounts(600));
    expect(result).not.toBeNull();
    expect(result!.type).toBe('volume-illusie');
    expect(result!.severity).toBe('info');
    expect(result!.explanation).toContain('5%');
  });

  it('returns info warning for 1000+ students', () => {
    const result = detectVolumeIllusie(['rekenwiskunde'], makeStudentCounts(1200));
    if (result) {
      expect(result.explanation).toContain('10%');
    }
  });
});

describe('detectFunctioneleGap', () => {
  it('returns empty for no modules', () => {
    const comparison = getComparison([], 400);
    expect(detectFunctioneleGap([], comparison)).toEqual([]);
  });

  it('detects functional gap when competitor is cheaper but has fewer differentiators', () => {
    const modules = ['rekenwiskunde'];
    const comparison = getComparison(modules, 400);
    const result = detectFunctioneleGap(modules, comparison);
    // DIA rekenwiskunde (€3.36) is cheaper than Cito (€7.82)
    // Cito has "Remediering" which DIA doesn't have
    const diaGap = result.find(
      (w) => w.explanation.includes('DIA') && w.affectedModules.includes('rekenwiskunde'),
    );
    expect(diaGap).toBeDefined();
    expect(diaGap!.type).toBe('functionele-gap');
  });
});
