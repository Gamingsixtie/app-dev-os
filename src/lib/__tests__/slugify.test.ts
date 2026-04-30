import { describe, it, expect, vi } from 'vitest';

// Mock supabase for uniqueSlug
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    }),
  },
}));

import { generateSlug, uniqueSlug } from '../slugify';

describe('generateSlug', () => {
  it('converts name to lowercase kebab-case', () => {
    expect(generateSlug('Test School')).toBe('test-school');
  });

  it('handles Dutch characters', () => {
    const slug = generateSlug('IJssel College');
    expect(slug).toBeTruthy();
    expect(slug).not.toContain(' ');
  });

  it('removes special characters', () => {
    const slug = generateSlug('School #1 (Amsterdam)');
    expect(slug).not.toContain('#');
    expect(slug).not.toContain('(');
    expect(slug).not.toContain(')');
  });

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('');
  });

  it('handles already-lowercase names', () => {
    expect(generateSlug('test')).toBe('test');
  });
});

describe('uniqueSlug', () => {
  it('returns base slug when no conflict exists', async () => {
    const slug = await uniqueSlug('Test School');
    expect(slug).toBe('test-school');
  });

  it('returns empty string for empty name', async () => {
    const slug = await uniqueSlug('');
    expect(slug).toBe('');
  });
});
