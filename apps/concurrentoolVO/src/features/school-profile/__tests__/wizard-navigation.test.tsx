import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { createMemoryHistory, createRouter, createRootRoute, createRoute, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WizardShell from '../../../components/wizard/WizardShell';
import { useSchoolProfileStore } from '../store';
import { db } from '@/db/database';

// Create a minimal router that provides the params WizardShell expects
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
    </QueryClientProvider>
  );
}

describe('Wizard Navigation', () => {
  beforeEach(async () => {
    useSchoolProfileStore.getState().reset();
    await db.schools.clear();
    // Seed a test school so the store has an activeSchoolId
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

  it('progress bar shows 5 steps with correct labels', async () => {
    renderWithRouter();

    expect(await screen.findByText('School')).toBeInTheDocument();
    expect(screen.getByText('Leerlingen')).toBeInTheDocument();
    expect(screen.getByText('Modules')).toBeInTheDocument();
    expect(screen.getByText('Situatie')).toBeInTheDocument();
    expect(screen.getByText('Doel')).toBeInTheDocument();
  });

  it('"Vorige stap" button is hidden on step 1', async () => {
    renderWithRouter();

    // Wait for render
    await screen.findByText('School');

    expect(screen.queryByText('Vorige stap')).not.toBeInTheDocument();
  });

  it('"Volgende stap" button is present', async () => {
    renderWithRouter();

    expect(await screen.findByText('Volgende stap')).toBeInTheDocument();
  });

  it('clicking "Volgende stap" without selection does not navigate (step 1 validation)', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.click(await screen.findByText('Volgende stap'));

    // Should still be on step 1
    expect(screen.getByText('Schoolgegevens en niveaus')).toBeInTheDocument();
  });

  it('navigating forward then back preserves previously entered data', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    // Fill school name
    const nameInput = await screen.findByLabelText('Schoolnaam');
    await user.type(nameInput, 'Test School');

    // Step 1: select HAVO
    const havoCheckbox = screen.getByRole('checkbox', { name: /HAVO/i });
    await user.click(havoCheckbox);
    // Phase 27 Plan 03 (R3 + R4) — Step 1 has 3 additional required fields.
    await user.click(screen.getByRole('radio', { name: 'Huidige Cito-klant' }));
    await user.selectOptions(screen.getByLabelText('Schoolsoort:'), 'regulier');
    await user.click(screen.getByRole('radio', { name: 'Groeit' }));

    // Navigate forward
    await user.click(screen.getByText('Volgende stap'));

    // Should be on step 2
    expect(await screen.findByText('Hoeveel leerlingen per leerjaar?')).toBeInTheDocument();

    // Navigate back
    await user.click(screen.getByText('Vorige stap'));

    // Should be back on step 1
    expect(await screen.findByText('Schoolgegevens en niveaus')).toBeInTheDocument();
    // Data is preserved in the store
    const state = useSchoolProfileStore.getState();
    expect(state.levels).toContain('havo');
  });

  it('clicking a future step in the progress bar does NOT navigate', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    // Wait for initial render
    await screen.findByText('Volgende stap');

    // Try clicking step 3 (Modules) which is a future step
    const modulesButton = screen.getByLabelText(/Stap 3: Modules/);
    await user.click(modulesButton);

    // Should still be on step 1
    expect(screen.getByText('Schoolgegevens en niveaus')).toBeInTheDocument();
  });

  it('clicking a completed step in the progress bar navigates back', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    // Fill school name
    const nameInput = await screen.findByLabelText('Schoolnaam');
    await user.type(nameInput, 'Test School');

    // Complete step 1: select HAVO + new required fields, then navigate forward.
    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));
    // Phase 27 Plan 03 (R3 + R4) — Step 1 has 3 additional required fields.
    await user.click(screen.getByRole('radio', { name: 'Huidige Cito-klant' }));
    await user.selectOptions(screen.getByLabelText('Schoolsoort:'), 'regulier');
    await user.click(screen.getByRole('radio', { name: 'Groeit' }));
    await user.click(screen.getByText('Volgende stap'));

    // Should be on step 2
    expect(await screen.findByText('Hoeveel leerlingen per leerjaar?')).toBeInTheDocument();

    // Click completed step 1 in progress bar
    const step1Button = screen.getByLabelText(/Stap 1: School.*voltooid/);
    await user.click(step1Button);

    // Should navigate back to step 1
    expect(await screen.findByText('Schoolgegevens en niveaus')).toBeInTheDocument();
  });

  it('shows "Bekijk resultaten" on the last step instead of "Volgende stap"', async () => {
    // Set store to step 5 (index 4)
    useSchoolProfileStore.setState({ currentStep: 4 });
    renderWithRouter('5');

    expect(await screen.findByText('Bekijk resultaten')).toBeInTheDocument();
    expect(screen.queryByText('Volgende stap')).not.toBeInTheDocument();
  });
});
