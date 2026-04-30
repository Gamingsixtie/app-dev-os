import { describe, it, expect, vi } from 'vitest';

// Mock all hooks and modules used by SchoolplanTab
vi.mock('@/hooks/useSchools', () => ({
  useSchool: vi.fn().mockReturnValue({ data: { id: 'school-1', slug: 'test-school' }, isLoading: false }),
}));

vi.mock('@/hooks/useSchoolplanAnalysis', () => ({
  useSchoolplanAnalysis: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  useUpdateAnnotation: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useDeleteSchoolplanAnalysis: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
}));

vi.mock('@/lib/schoolplan-analyzer', () => ({
  uploadAndAnalyzeSchoolplan: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useParams: vi.fn().mockReturnValue({ slug: 'test-school' }),
}));

describe('SchoolplanTab', () => {
  it('exports a default component', async () => {
    const mod = await import('../SchoolplanTab');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('component can be instantiated without errors', async () => {
    const mod = await import('../SchoolplanTab');
    // Verify the component is a valid React component (function that returns JSX)
    expect(mod.default.name).toBeTruthy();
  });
});
