import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase client
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import {
  useSchoolPrices,
  useCreateSchoolPrice,
  useDeleteSchoolPrice,
} from '../useSchoolPrices';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const samplePriceRow = {
  id: 'p1',
  school_id: 's1',
  module_id: 'rekenwiskunde',
  provider: 'cito',
  amount: 7.98,
  price_type: 'publication',
  discount_percentage: 0,
  source: 'manual',
  verified_at: null,
  note: '',
  is_active: true,
  activation_reason: null,
  activated_at: null,
  created_by: null,
  updated_by: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

describe('useSchoolPrices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns price entries for a school', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [samplePriceRow], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useSchoolPrices('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].moduleId).toBe('rekenwiskunde');
    expect(result.current.data![0].amount).toBe(7.98);
  });

  it('returns empty array when no prices exist', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useSchoolPrices('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('returns error when query fails', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: new Error('Query error') }),
        }),
      }),
    });

    const { result } = renderHook(() => useSchoolPrices('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('does not fetch when schoolId is empty', () => {
    const { result } = renderHook(() => useSchoolPrices(''), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('handles null data response gracefully', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useSchoolPrices('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useCreateSchoolPrice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts a price record via supabase', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useCreateSchoolPrice(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        schoolId: 's1',
        data: { moduleId: 'rekenwiskunde', provider: 'cito', amount: 7.98, priceType: 'publication' },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('school_prices');
  });
});

describe('useDeleteSchoolPrice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a price record', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const { result } = renderHook(() => useDeleteSchoolPrice(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ schoolId: 's1', priceId: 'p1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
