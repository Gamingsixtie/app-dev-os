import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockFrom = vi.fn();
const mockAddSystemEvent = vi.fn();
const mockMapSystemEventRow = vi.fn((row: Record<string, unknown>) => ({
  id: row.id,
  schoolId: row.school_id,
  type: row.type,
  description: row.description,
  timestamp: row.timestamp,
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@/db/operations', () => ({
  addSystemEvent: (...args: unknown[]) => mockAddSystemEvent(...args),
  mapSystemEventRow: (...args: unknown[]) => mockMapSystemEventRow(...args),
}));

import { useSystemEvents, useAddSystemEvent } from '../useSystemEvents';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useSystemEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns system events for a school', async () => {
    const rows = [
      { id: 'se1', school_id: 's1', type: 'status_change', description: 'Status changed', timestamp: '2026-03-01' },
    ];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: rows, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useSystemEvents('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('returns empty array for no events', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useSystemEvents('s1'), { wrapper: createWrapper() });

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

    const { result } = renderHook(() => useSystemEvents('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('does not fetch when schoolId is empty', () => {
    const { result } = renderHook(() => useSystemEvents(''), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useAddSystemEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls addSystemEvent with schoolId and event data', async () => {
    mockAddSystemEvent.mockResolvedValue({ id: 'se2' });

    const { result } = renderHook(() => useAddSystemEvent(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        schoolId: 's1',
        event: { type: 'status_change', description: 'Test event' } as any,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAddSystemEvent).toHaveBeenCalledWith('s1', expect.objectContaining({ type: 'status_change' }));
  });
});
