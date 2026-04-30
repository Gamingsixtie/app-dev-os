import { describe, expect, it, vi } from 'vitest';
import { getSmartRedirect } from '../guards';

// Mock the Supabase-based operations used by checkSchoolExists
vi.mock('@/db/operations', () => ({
  getSchoolBySlug: vi.fn().mockImplementation(async (slug: string) => {
    if (slug === 'montessori-college') {
      return {
        id: 'test-uuid',
        slug: 'montessori-college',
        name: 'Montessori College',
        createdAt: '2026-03-15T10:00:00Z',
        updatedAt: '2026-03-15T10:00:00Z',
      };
    }
    return null;
  }),
}));

describe('Router guards', () => {
  describe('getSmartRedirect', () => {
    it('redirects to /scholen when 0 schools', async () => {
      const result = await getSmartRedirect(0);
      expect(result.to).toBe('/scholen');
    });

    it('redirects to wizard when 1 school', async () => {
      const result = await getSmartRedirect(1, 'montessori-college');
      expect(result.to).toBe('/scholen/$slug/wizard/$step');
      expect(result.params).toEqual({ slug: 'montessori-college', step: '1' });
    });

    it('redirects to /scholen when 5 schools', async () => {
      const result = await getSmartRedirect(5);
      expect(result.to).toBe('/scholen');
    });
  });

  describe('checkSchoolExists', () => {
    it('returns school record when slug exists', async () => {
      const { checkSchoolExists } = await import('../guards');
      const result = await checkSchoolExists('montessori-college');
      expect(result).toBeDefined();
      expect(result!.name).toBe('Montessori College');
    });

    it('returns undefined for nonexistent slug', async () => {
      const { checkSchoolExists } = await import('../guards');
      const result = await checkSchoolExists('nonexistent');
      expect(result).toBeUndefined();
    });
  });
});
