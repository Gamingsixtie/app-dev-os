import { describe, it, expect, vi } from 'vitest';

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({ data: { opportunity_annotations: {} }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  },
}));

describe('useSchoolplanAnalysis hooks', () => {
  it('exports useSchoolplanAnalysis function', async () => {
    const mod = await import('../useSchoolplanAnalysis');
    expect(typeof mod.useSchoolplanAnalysis).toBe('function');
  });

  it('exports useUpdateAnnotation function', async () => {
    const mod = await import('../useSchoolplanAnalysis');
    expect(typeof mod.useUpdateAnnotation).toBe('function');
  });

  it('exports useDeleteSchoolplanAnalysis function', async () => {
    const mod = await import('../useSchoolplanAnalysis');
    expect(typeof mod.useDeleteSchoolplanAnalysis).toBe('function');
  });
});
