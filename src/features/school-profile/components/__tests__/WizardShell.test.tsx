import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMemoryHistory,
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WizardShell from '../../../../components/wizard/WizardShell';
import { useSchoolProfileStore } from '../../store';
import { db } from '@/db/database';

function renderWithRouter(stepNum = '1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const schoolRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/scholen/$slug',
  });
  const wizardRoute = createRoute({
    getParentRoute: () => schoolRoute,
    path: '/wizard/$step',
    component: WizardShell,
  });
  const routeTree = rootRoute.addChildren([
    schoolRoute.addChildren([wizardRoute]),
  ]);

  const memoryHistory = createMemoryHistory({
    initialEntries: [`/scholen/test-school/wizard/${stepNum}`],
  });

  const router = createRouter({ routeTree, history: memoryHistory });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('WizardShell - Step rendering and navigation', () => {
  beforeEach(async () => {
    useSchoolProfileStore.getState().reset();
    await db.schools.clear();
    await db.schools.add({
      slug: 'test-school',
      name: 'Test School',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isComplete: false,
      completedSteps: [],
      levels: [],
      studentCounts: {},
      selectedModules: [],
      moduleSetups: [],
      scenario: null,
      appliedOverrides: [],
      migrationHourlyRate: 50,
      migrationTimeSavingOverrides: {},
      switchingCosts: 0,
      contacts: [],
      conversations: [],
      actions: [],
      systemEvents: [],
      pipelineStatus: 'prospect',
      region: '',
      tags: [],
      viewPreference: 'compact',
    });
  });

  it('renders step 1 content when currentStep is 0', async () => {
    renderWithRouter();
    expect(await screen.findByText('Schoolgegevens en niveaus')).toBeInTheDocument();
  });

  it('"Volgende stap" button advances to step 2 when step 1 is valid', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    // Fill required fields for step 1
    const nameInput = await screen.findByLabelText('Schoolnaam');
    await user.type(nameInput, 'Test School');
    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));

    // Click next
    await user.click(screen.getByText('Volgende stap'));

    // Should show step 2 content
    expect(await screen.findByText('Hoeveel leerlingen per leerjaar?')).toBeInTheDocument();
  });

  it('"Vorige stap" button navigates back', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    // Complete step 1
    const nameInput = await screen.findByLabelText('Schoolnaam');
    await user.type(nameInput, 'Test School');
    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));
    await user.click(screen.getByText('Volgende stap'));

    // Should be on step 2
    expect(await screen.findByText('Hoeveel leerlingen per leerjaar?')).toBeInTheDocument();

    // Go back
    await user.click(screen.getByText('Vorige stap'));

    // Should be on step 1 again
    expect(await screen.findByText('Schoolgegevens en niveaus')).toBeInTheDocument();
  });

  it('progress bar shows correct step labels', async () => {
    renderWithRouter();

    expect(await screen.findByText('School')).toBeInTheDocument();
    expect(screen.getByText('Leerlingen')).toBeInTheDocument();
    expect(screen.getByText('Modules')).toBeInTheDocument();
    expect(screen.getByText('Situatie')).toBeInTheDocument();
    expect(screen.getByText('Doel')).toBeInTheDocument();
  });

  it('shows "Bekijk resultaten" on the last step instead of "Volgende stap"', async () => {
    useSchoolProfileStore.setState({ currentStep: 4 });
    renderWithRouter('5');

    expect(await screen.findByText('Bekijk resultaten')).toBeInTheDocument();
    expect(screen.queryByText('Volgende stap')).not.toBeInTheDocument();
  });

  it('integration: full wizard flow persists correct store state', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    // Step 1: select levels
    const nameInput = await screen.findByLabelText('Schoolnaam');
    await user.type(nameInput, 'Integratietest School');
    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));
    await user.click(screen.getByRole('checkbox', { name: /VWO/i }));
    await user.click(screen.getByText('Volgende stap'));

    // Verify step 1 data persisted to store
    const stateAfterStep1 = useSchoolProfileStore.getState();
    expect(stateAfterStep1.levels).toContain('havo');
    expect(stateAfterStep1.levels).toContain('vwo');
    expect(stateAfterStep1.schoolName).toBe('Integratietest School');

    // Step 2: enter student counts
    expect(await screen.findByText('Hoeveel leerlingen per leerjaar?')).toBeInTheDocument();
    const inputs = screen.getAllByRole('spinbutton');
    // Fill first input with 100
    await user.clear(inputs[0]);
    await user.type(inputs[0], '100');
    await user.click(screen.getByText('Volgende stap'));

    // Verify step 2 data persisted
    const stateAfterStep2 = useSchoolProfileStore.getState();
    expect(stateAfterStep2.studentCounts['havo']).toBeDefined();

    // Step 3: select modules
    expect(await screen.findByText('Welke toetsen en instrumenten gebruikt uw school?')).toBeInTheDocument();
    // Click on a module card
    await user.click(screen.getByText('Reken-Wiskunde').closest('button')!);
    await user.click(screen.getByText('Volgende stap'));

    // Verify step 3 data persisted
    const stateAfterStep3 = useSchoolProfileStore.getState();
    expect(stateAfterStep3.selectedModules).toContain('rekenwiskunde');

    // Step 4: current situation -- just submit with defaults
    expect(await screen.findByText('Wat is de huidige situatie?')).toBeInTheDocument();
    await user.click(screen.getByText('Volgende stap'));

    // Step 5: select scenario
    expect(await screen.findByText('Wat wilt u vergelijken?')).toBeInTheDocument();
    const scenarioACard = screen.getByText('Cito vs. concurrentie').closest('button')!;
    await user.click(scenarioACard);

    // Verify final store state
    const finalState = useSchoolProfileStore.getState();
    expect(finalState.levels).toEqual(expect.arrayContaining(['havo', 'vwo']));
    expect(finalState.schoolName).toBe('Integratietest School');
    expect(finalState.selectedModules).toContain('rekenwiskunde');
  });
});
