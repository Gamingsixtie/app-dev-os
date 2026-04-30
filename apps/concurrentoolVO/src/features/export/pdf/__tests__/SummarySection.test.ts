import { describe, it, expect } from 'vitest';
import { getSummaryBullets } from '../components/SummarySection';
import type { ReportData } from '../../types';

function createMockData(overrides: Partial<ReportData> = {}): ReportData {
  return {
    schoolName: 'Test School',
    date: '2026-03-24',
    selectedModules: ['lvs-vo'],
    totalStudents: 500,
    comparison: null,
    migration: null,
    priceDifference: null,
    ...overrides,
  };
}

describe('getSummaryBullets', () => {
  describe('practical focus (coordinator)', () => {
    it('includes "uur tijdwinst" when migration data present', () => {
      const data = createMockData({
        migration: {
          modules: [],
          timeSavings: [],
          totalTimeSavingsHours: 120,
          totalTimeSavingsValue: 4800,
          totalOldCost: 5000,
          totalNewCost: 4000,
          financialDifference: 1000,
          totalAnnualValue: 5800,
          multiYearProjection: [],
          breakEvenMonth: 6,
          switchingCosts: 0,
        },
      });
      const bullets = getSummaryBullets(data, 'practical');
      expect(bullets.some((b) => b.includes('uur tijdwinst'))).toBe(true);
    });

    it('includes "handmatig werk" bullet', () => {
      const data = createMockData({
        migration: {
          modules: [],
          timeSavings: [],
          totalTimeSavingsHours: 10,
          totalTimeSavingsValue: 400,
          totalOldCost: 0,
          totalNewCost: 0,
          financialDifference: 0,
          totalAnnualValue: 400,
          multiYearProjection: [],
          breakEvenMonth: null,
          switchingCosts: 0,
        },
      });
      const bullets = getSummaryBullets(data, 'practical');
      expect(bullets.some((b) => b.includes('handmatig werk'))).toBe(true);
    });
  });

  describe('strategic focus (mt)', () => {
    it('includes "jaarlijkse waarde" when migration data present', () => {
      const data = createMockData({
        migration: {
          modules: [],
          timeSavings: [],
          totalTimeSavingsHours: 50,
          totalTimeSavingsValue: 2000,
          totalOldCost: 5000,
          totalNewCost: 4000,
          financialDifference: 1000,
          totalAnnualValue: 3000,
          multiYearProjection: [],
          breakEvenMonth: 6,
          switchingCosts: 0,
        },
      });
      const bullets = getSummaryBullets(data, 'strategic');
      expect(bullets.some((b) => b.includes('jaarlijkse waarde'))).toBe(true);
    });

    it('includes "toekomstbestendig" bullet', () => {
      const data = createMockData();
      const bullets = getSummaryBullets(data, 'strategic');
      expect(bullets.some((b) => b.toLowerCase().includes('toekomstbestendig'))).toBe(true);
    });
  });

  describe('financial focus (finance)', () => {
    it('includes "goedkoper per jaar" when price difference positive', () => {
      const data = createMockData({ priceDifference: 2500 });
      const bullets = getSummaryBullets(data, 'financial');
      expect(bullets.some((b) => b.includes('goedkoper per jaar'))).toBe(true);
    });

    it('includes "break-even" when breakEvenMonth present', () => {
      const data = createMockData({
        migration: {
          modules: [],
          timeSavings: [],
          totalTimeSavingsHours: 0,
          totalTimeSavingsValue: 0,
          totalOldCost: 5000,
          totalNewCost: 4000,
          financialDifference: 1000,
          totalAnnualValue: 1000,
          multiYearProjection: [],
          breakEvenMonth: 8,
          switchingCosts: 500,
        },
      });
      const bullets = getSummaryBullets(data, 'financial');
      expect(bullets.some((b) => b.includes('Break-even'))).toBe(true);
    });
  });

  describe('balanced focus (generiek)', () => {
    it('returns fallback bullet when no data', () => {
      const data = createMockData();
      const bullets = getSummaryBullets(data, 'balanced');
      expect(bullets).toHaveLength(1);
      expect(bullets[0]).toContain('publicatieprijzen');
    });
  });
});
