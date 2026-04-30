import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntakePanel } from '../IntakePanel';
import { useSchoolProfileStore } from '../../school-profile/store';

// Mock the AI intake function to avoid calling Claude in tests
vi.mock('@/lib/ai-intake', () => ({
  extractIntakeFromNotes: vi.fn().mockResolvedValue({
    levels: ['havo'],
    studentCountsPerLevel: { havo: 350 },
    studentCountsPerYear: {},
    selectedModules: ['rekenwiskunde'],
    moduleSetups: [{ moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 3.36 }],
    contactPersonen: [{ naam: 'Jan', rol: 'coordinator', email: 'jan@school.nl' }],
    actiePunten: [{ wat: 'Offerte sturen', wanneer: 'volgende week' }],
    unsureAbout: [],
  }),
  resolveStudentCounts: vi.fn().mockReturnValue({ havo: { 1: 100, 2: 100, 3: 80, 4: 70 } }),
  enrichModuleSetupsWithDefaultPrices: vi.fn().mockReturnValue([
    { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 3.36, priceSource: 'default' },
  ]),
}));

// Mock Supabase operations
vi.mock('@/db/operations', () => ({
  addContact: vi.fn().mockResolvedValue(undefined),
  addAction: vi.fn().mockResolvedValue(undefined),
  addConversation: vi.fn().mockResolvedValue(undefined),
  updateSchoolData: vi.fn().mockResolvedValue(undefined),
}));

function renderIntakePanel() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onComplete = vi.fn();
  const onSkip = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <IntakePanel onComplete={onComplete} onSkip={onSkip} />
    </QueryClientProvider>,
  );

  return { onComplete, onSkip };
}

describe('IntakePanel', () => {
  beforeEach(() => {
    useSchoolProfileStore.getState().reset();
    vi.clearAllMocks();
  });

  it('renders section text areas for note entry', () => {
    renderIntakePanel();

    expect(screen.getByLabelText('School & Niveaus')).toBeInTheDocument();
    expect(screen.getByLabelText('Modules & Aanbieders')).toBeInTheDocument();
    expect(screen.getByLabelText('Contactpersonen')).toBeInTheDocument();
    expect(screen.getByLabelText('Actiepunten & Overig')).toBeInTheDocument();
  });

  it('analyse button is disabled when no content is entered', () => {
    renderIntakePanel();

    const analyseButton = screen.getByText('Analyseer notities');
    expect(analyseButton).toBeDisabled();
  });

  it('analyse button becomes enabled after typing content', async () => {
    const user = userEvent.setup();
    renderIntakePanel();

    const textarea = screen.getByLabelText('School & Niveaus');
    await user.type(textarea, 'HAVO en VWO, 350 leerlingen');

    const analyseButton = screen.getByText('Analyseer notities');
    expect(analyseButton).not.toBeDisabled();
  });

  it('submit triggers AI analysis and shows extracted data', async () => {
    const user = userEvent.setup();
    renderIntakePanel();

    // Fill in some content
    await user.type(screen.getByLabelText('School & Niveaus'), 'HAVO, 350 leerlingen');

    // Click analyse
    await user.click(screen.getByText('Analyseer notities'));

    // Wait for extraction preview
    await waitFor(() => {
      expect(screen.getByText('AI heeft het volgende herkend')).toBeInTheDocument();
    });
  });

  it('skip button calls onSkip', async () => {
    const user = userEvent.setup();
    const { onSkip } = renderIntakePanel();

    await user.click(screen.getByText('Sla over — open wizard handmatig'));
    expect(onSkip).toHaveBeenCalled();
  });

  it('renders page heading in Dutch', () => {
    renderIntakePanel();

    expect(screen.getByText('Noteer wat u hoort — AI vult de wizard in')).toBeInTheDocument();
  });
});
