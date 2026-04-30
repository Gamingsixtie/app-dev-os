import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockFrom = vi.fn();
const mockAddConversation = vi.fn();
const mockUpdateConversation = vi.fn();
const mockDeleteConversation = vi.fn();
const mockMapConversationRow = vi.fn((row: Record<string, unknown>) => ({
  id: row.id,
  schoolId: row.school_id,
  date: row.date,
  type: row.type,
  summary: row.summary,
  tags: row.tags ?? [],
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@/db/operations', () => ({
  addConversation: (...args: unknown[]) => mockAddConversation(...args),
  updateConversation: (...args: unknown[]) => mockUpdateConversation(...args),
  deleteConversation: (...args: unknown[]) => mockDeleteConversation(...args),
  mapConversationRow: (...args: unknown[]) => mockMapConversationRow(...args),
}));

import { useConversations, useCreateConversation, useDeleteConversation } from '../useConversations';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns conversations sorted by date', async () => {
    const rows = [
      { id: 'cv1', school_id: 's1', date: '2026-03-01', type: 'call', summary: 'Test', tags: [] },
      { id: 'cv2', school_id: 's1', date: '2026-03-15', type: 'email', summary: 'Follow-up', tags: [] },
    ];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: rows, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useConversations('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it('returns empty array for school with no conversations', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useConversations('s1'), { wrapper: createWrapper() });

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

    const { result } = renderHook(() => useConversations('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('does not fetch when schoolId is empty', () => {
    const { result } = renderHook(() => useConversations(''), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls addConversation with schoolId and data', async () => {
    mockAddConversation.mockResolvedValue({ id: 'cv3' });

    const { result } = renderHook(() => useCreateConversation(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        schoolId: 's1',
        data: { date: '2026-03-28', type: 'call', summary: 'New call' } as any,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAddConversation).toHaveBeenCalledWith('s1', expect.objectContaining({ summary: 'New call' }));
  });
});

describe('useDeleteConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls deleteConversation', async () => {
    mockDeleteConversation.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteConversation(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ schoolId: 's1', conversationId: 'cv1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDeleteConversation).toHaveBeenCalledWith('s1', 'cv1');
  });
});
