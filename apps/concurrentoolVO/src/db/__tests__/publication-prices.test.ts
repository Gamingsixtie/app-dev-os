import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PublicationPrice, PriceProposal } from '../pricing-types';

// --- Supabase mock setup ---
// vi.mock factory is hoisted, so we use a simple mock that we configure per test.

const mockFrom = vi.fn();
const mockGetUser = vi.fn();
const mockGetSession = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getUser: () => mockGetUser(),
      getSession: () => mockGetSession(),
    },
  },
}));

import {
  fetchPublicationPrices,
  createPriceProposal,
  approveProposal,
  rejectProposal,
  fetchOpenProposalCount,
} from '../pricing-operations';

describe('publication-prices CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
  });

  it('fetchPublicationPrices returns typed PublicationPrice[] array', async () => {
    const mockPrices: PublicationPrice[] = [
      {
        id: '1',
        team_id: 'team-1',
        module_id: 'rekenwiskunde',
        provider: 'cito',
        amount_per_student: 5.5,
        source: 'seed',
        source_label: 'Initieel vanuit brondata',
        verified_at: '2026-01-01T00:00:00Z',
        is_active: true,
        note: null,
        created_by: null,
        updated_by: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    const eqMock = vi.fn().mockResolvedValue({ data: mockPrices, error: null });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selectMock });

    const result = await fetchPublicationPrices();
    expect(result).toEqual(mockPrices);
    expect(mockFrom).toHaveBeenCalledWith('publication_prices');
    expect(selectMock).toHaveBeenCalledWith('*');
    expect(eqMock).toHaveBeenCalledWith('is_active', true);
  });

  it('createPriceProposal creates proposal with status open and correct submitted_by', async () => {
    const proposalData = {
      module_id: 'rekenwiskunde',
      provider: 'cito',
      current_price: 5.5,
      proposed_price: 6.0,
      source: 'publicatieprijzen 2026',
      explanation: 'Prijs is aangepast in nieuwe catalogus',
    };

    const mockResult: PriceProposal = {
      id: 'prop-1',
      team_id: 'team-1',
      ...proposalData,
      evidence_path: null,
      status: 'open',
      rejection_reason: null,
      submitted_by: 'user-123',
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    // getTeamId: from('users').select('team_id').eq('id', userId).single()
    const userSingleMock = vi.fn().mockResolvedValue({ data: { team_id: 'team-1' }, error: null });
    const userEqMock = vi.fn().mockReturnValue({ single: userSingleMock });
    const userSelectMock = vi.fn().mockReturnValue({ eq: userEqMock });

    // from('price_proposals').insert().select().single()
    const singleMock = vi.fn().mockResolvedValue({ data: mockResult, error: null });
    const propSelectMock = vi.fn().mockReturnValue({ single: singleMock });
    const insertMock = vi.fn().mockReturnValue({ select: propSelectMock });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return { select: userSelectMock };
      if (table === 'price_proposals') return { insert: insertMock };
      return {};
    });

    const result = await createPriceProposal(proposalData);
    expect(result).toEqual(mockResult);
    expect(mockFrom).toHaveBeenCalledWith('price_proposals');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        submitted_by: 'user-123',
        team_id: 'team-1',
        module_id: 'rekenwiskunde',
      }),
    );
  });

  it('approveProposal updates proposal status to approved and upserts publication_prices', async () => {
    const proposal: PriceProposal = {
      id: 'prop-1',
      team_id: 'team-1',
      module_id: 'rekenwiskunde',
      provider: 'cito',
      current_price: 5.5,
      proposed_price: 6.0,
      source: 'publicatieprijzen 2026',
      explanation: 'Prijs aangepast',
      evidence_path: null,
      status: 'open',
      rejection_reason: null,
      submitted_by: 'user-456',
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    const calledTables: string[] = [];

    mockFrom.mockImplementation((table: string) => {
      calledTables.push(table);
      if (table === 'price_proposals') {
        // Need both select (for fetch) and update (for status change)
        const singleMock = vi.fn().mockResolvedValue({ data: proposal, error: null });
        const eqForSelect = vi.fn().mockReturnValue({ single: singleMock });
        const selectMock = vi.fn().mockReturnValue({ eq: eqForSelect });
        const eqForUpdate = vi.fn().mockResolvedValue({ data: null, error: null });
        const updateMock = vi.fn().mockReturnValue({ eq: eqForUpdate });
        return { select: selectMock, update: updateMock };
      }
      if (table === 'publication_prices') {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      if (table === 'price_audit_log') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return {};
    });

    await approveProposal('prop-1');

    expect(calledTables).toContain('price_proposals');
    expect(calledTables).toContain('publication_prices');
    expect(calledTables).toContain('price_audit_log');
  });

  it('rejectProposal requires a reason string and updates status to rejected', async () => {
    const proposal: PriceProposal = {
      id: 'prop-2',
      team_id: 'team-1',
      module_id: 'nederlands',
      provider: 'dia',
      current_price: 3.36,
      proposed_price: 4.0,
      source: 'offerte',
      explanation: 'Nieuwe offerte ontvangen',
      evidence_path: null,
      status: 'open',
      rejection_reason: null,
      submitted_by: 'user-456',
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    const calledTables: string[] = [];

    mockFrom.mockImplementation((table: string) => {
      calledTables.push(table);
      if (table === 'price_proposals') {
        const singleMock = vi.fn().mockResolvedValue({ data: proposal, error: null });
        const eqForSelect = vi.fn().mockReturnValue({ single: singleMock });
        const selectMock = vi.fn().mockReturnValue({ eq: eqForSelect });
        const eqForUpdate = vi.fn().mockResolvedValue({ data: null, error: null });
        const updateMock = vi.fn().mockReturnValue({ eq: eqForUpdate });
        return { select: selectMock, update: updateMock };
      }
      if (table === 'price_audit_log') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return {};
    });

    await rejectProposal('prop-2', 'Bron niet betrouwbaar');

    expect(calledTables).toContain('price_proposals');
    expect(calledTables).toContain('price_audit_log');

    // Verify empty reason throws
    await expect(rejectProposal('prop-2', '')).rejects.toThrow('Reden voor afwijzing is verplicht');
  });

  it('fetchOpenProposalCount returns count of open proposals for team', async () => {
    const eqMock = vi.fn().mockResolvedValue({ count: 3, error: null });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selectMock });

    const count = await fetchOpenProposalCount();
    expect(count).toBe(3);
    expect(mockFrom).toHaveBeenCalledWith('price_proposals');
    expect(selectMock).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(eqMock).toHaveBeenCalledWith('status', 'open');
  });
});
