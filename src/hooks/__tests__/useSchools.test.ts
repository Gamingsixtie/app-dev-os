import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock db operations
const mockGetAllSchools = vi.fn();
const mockGetSchoolBySlug = vi.fn();
const mockCreateSchool = vi.fn();
const mockUpdateSchoolData = vi.fn();
const mockDeleteSchool = vi.fn();

vi.mock('@/db/operations', () => ({
  getAllSchools: (...args: unknown[]) => mockGetAllSchools(...args),
  getSchoolBySlug: (...args: unknown[]) => mockGetSchoolBySlug(...args),
  createSchool: (...args: unknown[]) => mockCreateSchool(...args),
  updateSchoolData: (...args: unknown[]) => mockUpdateSchoolData(...args),
  deleteSchool: (...args: unknown[]) => mockDeleteSchool(...args),
}));

import { useSchools, useSchool, useCreateSchool, useUpdateSchool, useDeleteSchool } from '../useSchools';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useSchools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading=true initially then data on success', async () => {
    const schools = [{ id: '1', name: 'School A', slug: 'school-a' }];
    mockGetAllSchools.mockResolvedValue(schools);

    const { result } = renderHook(() => useSchools(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(schools);
  });

  it('returns error on failure', async () => {
    mockGetAllSchools.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useSchools(), { wrapper: createWrapper() });

    // useSchools has retry: 2, so it retries twice before erroring
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 10000 });
    expect(result.current.error).toBeDefined();
  });

  it('handles empty array response', async () => {
    mockGetAllSchools.mockResolvedValue([]);

    const { result } = renderHook(() => useSchools(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useSchool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns school data for a valid slug', async () => {
    const school = { id: '1', name: 'Test School', slug: 'test-school' };
    mockGetSchoolBySlug.mockResolvedValue(school);

    const { result } = renderHook(() => useSchool('test-school'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(school);
    expect(mockGetSchoolBySlug).toHaveBeenCalledWith('test-school');
  });

  it('does not fetch when slug is empty', async () => {
    const { result } = renderHook(() => useSchool(''), { wrapper: createWrapper() });

    // Should not trigger the query
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetSchoolBySlug).not.toHaveBeenCalled();
  });

  it('returns error on failure', async () => {
    mockGetSchoolBySlug.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useSchool('bad-slug'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateSchool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls createSchool with the provided name', async () => {
    mockCreateSchool.mockResolvedValue({ id: '2', name: 'New School' });

    const { result } = renderHook(() => useCreateSchool(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate('New School');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockCreateSchool).toHaveBeenCalledWith('New School');
  });
});

describe('useUpdateSchool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateSchoolData with id and data', async () => {
    mockUpdateSchoolData.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateSchool(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ id: '1', data: { name: 'Updated' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdateSchoolData).toHaveBeenCalledWith('1', { name: 'Updated' });
  });
});

describe('useDeleteSchool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls deleteSchool with the provided id', async () => {
    mockDeleteSchool.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteSchool(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate('1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDeleteSchool).toHaveBeenCalledWith('1');
  });
});
