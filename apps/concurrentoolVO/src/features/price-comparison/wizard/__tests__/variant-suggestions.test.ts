import { describe, it, expect } from 'vitest';
import { suggestDiaPackage, suggestJijTier } from '../variant-suggestions';

describe('suggestDiaPackage', () => {
  it('returns "pakket-ne" for ["nederlands"]', () => {
    const result = suggestDiaPackage(['nederlands']);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('pakket-ne');
  });

  it('returns a qualifying package for ["rekenwiskunde", "nederlands", "engels", "taalverzorging"]', () => {
    const result = suggestDiaPackage(['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging']);
    expect(result).not.toBeNull();
    // Should return pakket-compleet as cheapest qualifying package covering all 4 modules
    expect(result!.id).toBe('pakket-compleet');
  });

  it('returns null for ["sociaal-emotioneel"] (no DIA package covers this)', () => {
    const result = suggestDiaPackage(['sociaal-emotioneel']);
    expect(result).toBeNull();
  });

  it('returns "pakket-en" for ["engels"]', () => {
    const result = suggestDiaPackage(['engels']);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('pakket-en');
  });

  it('returns null for empty module list', () => {
    const result = suggestDiaPackage([]);
    expect(result).toBeNull();
  });
});

describe('suggestJijTier', () => {
  it('returns tier 1 for 2500 students and 2 tests (5000 admins > 4001)', () => {
    const result = suggestJijTier(2500, 2);
    expect(result.tier).toBe(1);
  });

  it('returns tier 2 for 1500 students and 2 tests (3000 admins in 2501-4000)', () => {
    const result = suggestJijTier(1500, 2);
    expect(result.tier).toBe(2);
  });

  it('returns tier 3 for 800 students and 2 tests (1600 admins in 166-2500)', () => {
    const result = suggestJijTier(800, 2);
    expect(result.tier).toBe(3);
  });

  it('returns tier 4 for 50 students and 2 tests (100 admins in 0-165)', () => {
    const result = suggestJijTier(50, 2);
    expect(result.tier).toBe(4);
  });

  it('defaults to 2 tests per student when not specified', () => {
    const result = suggestJijTier(800);
    expect(result.tier).toBe(3); // 800*2=1600 -> tier 3
  });
});
