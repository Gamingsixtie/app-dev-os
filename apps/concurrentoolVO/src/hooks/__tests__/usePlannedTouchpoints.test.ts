import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockFrom = vi.fn();
const mockAddPlannedTouchpoint = vi.fn();
const mockUpdatePlannedTouchpoint = vi.fn();
const mockDeletePlannedTouchpoint = vi.fn();
const mockMapPlannedTouchpointRow = vi.fn((row: Record<string, unknown>) => ({
  id: row.id,
  schoolId: row.school_id,
  contactId: row.contact_id,
  schoolYearStart: row.school_year_start,
  monthIndex: row.month_index,
  note: row.note,
  status: row.status,
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@/db/operations', () => ({
  addPlannedTouchpoint: (...args: unknown[]) => mockAddPlannedTouchpoint(...args),
  updatePlannedTouchpoint: (...args: unknown[]) => mockUpdatePlannedTouchpoint(...args),
  deletePlannedTouchpoint: (...args: unknown[]) => mockDeletePlannedTouchpoint(...args),
  mapPlannedTouchpointRow: (...args: unknown[]) => mockMapPlannedTouchpointRow(...args),
}));

import { usePlannedTouchpoints, useCreatePlannedTouchpoint, useDeletePlannedTouchpoint } from '../usePlannedTouchpoints';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('usePlannedTouchpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns touchpoints for a school', async () => {
    const rows = [
      { id: 'tp1', school_id: 's1', contact_id: 'c1', school_year_start: 2025, month_index: 9, note: '', status: 'planned' },
    ];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: rows, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => usePlannedTouchpoints('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('returns empty array when no touchpoints', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => usePlannedTouchpoints('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('returns error on failure', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
        }),
      }),
    });

    const { result } = renderHook(() => usePlannedTouchpoints('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('does not fetch when schoolId is empty', () => {
    const { result } = renderHook(() => usePlannedTouchpoints(''), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreatePlannedTouchpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls addPlannedTouchpoint', async () => {
    mockAddPlannedTouchpoint.mockResolvedValue({ id: 'tp2' });

    const { result } = renderHook(() => useCreatePlannedTouchpoint(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        schoolId: 's1',
        data: { contactId: 'c1', schoolYearStart: 2025, monthIndex: 9 },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAddPlannedTouchpoint).toHaveBeenCalled();
  });
});

describe('useDeletePlannedTouchpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls deletePlannedTouchpoint', async () => {
    mockDeletePlannedTouchpoint.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeletePlannedTouchpoint(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ schoolId: 's1', touchpointId: 'tp1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDeletePlannedTouchpoint).toHaveBeenCalledWith('s1', 'tp1');
  });
});
