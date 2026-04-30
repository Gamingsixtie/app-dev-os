import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockFrom = vi.fn();
const mockAddAction = vi.fn();
const mockUpdateAction = vi.fn();
const mockDeleteAction = vi.fn();
const mockMapActionRow = vi.fn((row: Record<string, unknown>) => ({
  id: row.id,
  schoolId: row.school_id,
  title: row.title,
  status: row.status,
  dueDate: row.due_date,
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@/db/operations', () => ({
  addAction: (...args: unknown[]) => mockAddAction(...args),
  updateAction: (...args: unknown[]) => mockUpdateAction(...args),
  deleteAction: (...args: unknown[]) => mockDeleteAction(...args),
  mapActionRow: (...args: unknown[]) => mockMapActionRow(...args),
}));

import { useActions, useCreateAction, useUpdateAction, useDeleteAction } from '../useActions';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns action items for a school', async () => {
    const rows = [
      { id: 'a1', school_id: 's1', title: 'Follow up', status: 'open', due_date: '2026-04-01' },
    ];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: rows, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useActions('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].title).toBe('Follow up');
  });

  it('returns empty array when no actions exist', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useActions('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('returns error on failure', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: new Error('Failed') }),
        }),
      }),
    });

    const { result } = renderHook(() => useActions('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('does not fetch when schoolId is empty', () => {
    const { result } = renderHook(() => useActions(''), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls addAction with schoolId and data', async () => {
    mockAddAction.mockResolvedValue({ id: 'a2' });

    const { result } = renderHook(() => useCreateAction(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        schoolId: 's1',
        data: { title: 'New action', status: 'open' } as any,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAddAction).toHaveBeenCalledWith('s1', expect.objectContaining({ title: 'New action' }));
  });
});

describe('useDeleteAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls deleteAction', async () => {
    mockDeleteAction.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteAction(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ schoolId: 's1', actionId: 'a1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDeleteAction).toHaveBeenCalledWith('s1', 'a1');
  });
});
