import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../database';
import {
  detectV1Data,
  extractV1Data,
  extractV1PriceOverrides,
  migrateV1ToSchool,
  clearV1Data,
} from '../migrations';

const V1_PROFILE_KEY = 'rekentool-school-profile';
const V1_PRICE_KEY = 'rekentool-price-comparison';

function setV1Profile(state: Record<string, unknown>) {
  localStorage.setItem(V1_PROFILE_KEY, JSON.stringify({ state, version: 0 }));
}

function setV1Prices(state: Record<string, unknown>) {
  localStorage.setItem(V1_PRICE_KEY, JSON.stringify({ state, version: 0 }));
}

describe('v1 localStorage migration', () => {
  beforeEach(async () => {
    await db.schools.clear();
    localStorage.clear();
  });

  describe('detectV1Data', () => {
    it('returns true when localStorage has school profile key', () => {
      setV1Profile({ levels: ['havo'] });
      expect(detectV1Data()).toBe(true);
    });

    it('returns false when localStorage is empty', () => {
      expect(detectV1Data()).toBe(false);
    });
  });

  describe('extractV1Data', () => {
    it('extracts valid data with suggestedName from levels', () => {
      setV1Profile({
        levels: ['havo', 'vwo'],
        studentCounts: { havo: { 1: 100 } },
        selectedModules: ['mod-a'],
        moduleSetups: [{ moduleId: 'mod-a', currentProvider: 'geen', pricePerStudent: null }],
        scenario: 'A',
      });

      const result = extractV1Data();
      expect(result.success).toBe(true);
      expect(result.schoolRecord).toBeDefined();
      expect(result.schoolRecord!.levels).toEqual(['havo', 'vwo']);
      expect(result.schoolRecord!.scenario).toBe('A');
      expect(result.suggestedName).toBe('HAVO/VWO-school');
    });

    it('returns error for corrupt JSON', () => {
      localStorage.setItem(V1_PROFILE_KEY, 'not-json{{{');
      const result = extractV1Data();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Data kon niet worden gelezen');
    });

    it('returns error for missing state.levels', () => {
      setV1Profile({ scenario: 'A' }); // no levels
      const result = extractV1Data();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Corrupt data structure');
    });

    it('suggestedName for single level vmbo-b', () => {
      setV1Profile({ levels: ['vmbo-b'] });
      const result = extractV1Data();
      expect(result.suggestedName).toBe('VMBO Basis-school');
    });

    it('suggestedName for three levels', () => {
      setV1Profile({ levels: ['vmbo-gt', 'havo', 'vwo'] });
      const result = extractV1Data();
      expect(result.suggestedName).toBe('VMBO GT/HAVO/VWO-school');
    });
  });

  describe('extractV1PriceOverrides', () => {
    it('extracts price data when present', () => {
      setV1Prices({
        appliedOverrides: [{ moduleId: 'm1', provider: 'cito', amount: 10 }],
        migrationHourlyRate: 75,
        migrationTimeSavingOverrides: { task1: 5 },
      });

      const result = extractV1PriceOverrides();
      expect(result).not.toBeNull();
      expect(result!.appliedOverrides).toHaveLength(1);
      expect(result!.migrationHourlyRate).toBe(75);
      expect(result!.migrationTimeSavingOverrides).toEqual({ task1: 5 });
    });

    it('returns null when key is missing', () => {
      expect(extractV1PriceOverrides()).toBeNull();
    });
  });

  describe('migrateV1ToSchool', () => {
    it('creates a school record in Dexie with merged data', async () => {
      setV1Profile({
        levels: ['havo', 'vwo'],
        studentCounts: { havo: { 1: 100 } },
        selectedModules: ['mod-a'],
        moduleSetups: [],
        scenario: 'A',
      });
      setV1Prices({
        appliedOverrides: [{ moduleId: 'm1', provider: 'cito', amount: 10 }],
        migrationHourlyRate: 60,
        migrationTimeSavingOverrides: {},
      });

      const school = await migrateV1ToSchool('Mijn HAVO/VWO');
      expect(school.id).toBeDefined();
      expect(school.name).toBe('Mijn HAVO/VWO');
      expect(school.isComplete).toBe(true);
      expect(school.completedSteps).toEqual([0, 1, 2, 3, 4]);
      expect(school.levels).toEqual(['havo', 'vwo']);
      expect(school.appliedOverrides).toHaveLength(1);
      expect(school.migrationHourlyRate).toBe(60);
    });
  });

  describe('clearV1Data', () => {
    it('removes both localStorage keys', () => {
      setV1Profile({ levels: [] });
      setV1Prices({ appliedOverrides: [] });
      clearV1Data();
      expect(localStorage.getItem(V1_PROFILE_KEY)).toBeNull();
      expect(localStorage.getItem(V1_PRICE_KEY)).toBeNull();
    });
  });
});
