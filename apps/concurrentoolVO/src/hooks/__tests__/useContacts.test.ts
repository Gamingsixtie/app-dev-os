import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase + operations
const mockFrom = vi.fn();
const mockAddContact = vi.fn();
const mockUpdateContact = vi.fn();
const mockDeleteContact = vi.fn();
const mockSetEngagementStatus = vi.fn();
const mockMapContactRow = vi.fn((row: Record<string, unknown>) => ({
  id: row.id,
  schoolId: row.school_id,
  name: row.name,
  role: row.role,
  email: row.email,
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@/db/operations', () => ({
  addContact: (...args: unknown[]) => mockAddContact(...args),
  updateContact: (...args: unknown[]) => mockUpdateContact(...args),
  deleteContact: (...args: unknown[]) => mockDeleteContact(...args),
  setEngagementStatus: (...args: unknown[]) => mockSetEngagementStatus(...args),
  mapContactRow: (...args: unknown[]) => mockMapContactRow(...args),
}));

import { useContacts, useCreateContact, useDeleteContact } from '../useContacts';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useContacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns contacts for a school', async () => {
    const rows = [{ id: 'c1', school_id: 's1', name: 'Jan', role: 'coordinator', email: 'jan@test.nl' }];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: rows, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useContacts('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe('Jan');
  });

  it('returns empty array when school has no contacts', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useContacts('s1'), { wrapper: createWrapper() });

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

    const { result } = renderHook(() => useContacts('s1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('does not fetch when schoolId is empty', () => {
    const { result } = renderHook(() => useContacts(''), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls addContact with schoolId and data', async () => {
    mockAddContact.mockResolvedValue({ id: 'c2' });

    const { result } = renderHook(() => useCreateContact(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        schoolId: 's1',
        data: { name: 'Piet', role: 'rector', email: 'piet@test.nl' } as any,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAddContact).toHaveBeenCalledWith('s1', expect.objectContaining({ name: 'Piet' }));
  });
});

describe('useDeleteContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls deleteContact', async () => {
    mockDeleteContact.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteContact(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ schoolId: 's1', contactId: 'c1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDeleteContact).toHaveBeenCalledWith('s1', 'c1');
  });
});
