/**
 * Phase 26-05 — unit test for PriceImportDiffView (built in 26-04).
 *
 * Component contract:
 *   - input: DiffRow[] (path/currentValue/proposedValue/changed)
 *   - only rows with changed:true are rendered
 *   - starts with ALL changed rows accepted
 *   - "Alles selecteren" toggles ALL on/off
 *   - per-row checkbox toggles a single row
 *   - "Bevestig N wijzigingen" calls onConfirm with the accepted Set
 *   - "Annuleer" calls onCancel
 *   - empty/no-changes path renders a friendly NL message + a "Sluiten" cancel
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PriceImportDiffView } from '../components/PriceImportDiffView';
import type { DiffRow } from '../import/price-diff';

const diffRows: DiffRow[] = [
  {
    path: 'individualPrices.rekenwiskunde',
    currentValue: 7.98,
    proposedValue: 8.5,
    changed: true,
  },
  {
    path: 'individualPrices.nederlands',
    currentValue: 7.98,
    proposedValue: 8.0,
    changed: true,
  },
];

describe('PriceImportDiffView', () => {
  it('toont "Geen wijzigingen gevonden" bij lege diff', () => {
    render(
      <PriceImportDiffView
        diff={[]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        saving={false}
      />,
    );
    expect(screen.getByText(/Geen wijzigingen gevonden/)).toBeInTheDocument();
    // Empty path renders a "Sluiten" cancel button, not "Bevestig".
    expect(screen.getByText('Sluiten')).toBeInTheDocument();
    expect(screen.queryByText(/Bevestig/)).not.toBeInTheDocument();
  });

  it('negeert rijen met changed:false', () => {
    const mixed: DiffRow[] = [
      ...diffRows,
      {
        path: 'individualPrices.engels',
        currentValue: 7.98,
        proposedValue: 7.98,
        changed: false,
      },
    ];
    render(
      <PriceImportDiffView
        diff={mixed}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        saving={false}
      />,
    );
    expect(screen.getByText('individualPrices.rekenwiskunde')).toBeInTheDocument();
    expect(screen.getByText('individualPrices.nederlands')).toBeInTheDocument();
    expect(screen.queryByText('individualPrices.engels')).not.toBeInTheDocument();
    // Counter reflects 2 changed rows, not 3.
    expect(screen.getByText(/Alles selecteren \(2\)/)).toBeInTheDocument();
  });

  it('rendert beide rijen + "Alles selecteren (2)" + start met alles geselecteerd', () => {
    render(
      <PriceImportDiffView
        diff={diffRows}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        saving={false}
      />,
    );
    expect(screen.getByText(/Alles selecteren \(2\)/)).toBeInTheDocument();
    expect(screen.getByText('individualPrices.rekenwiskunde')).toBeInTheDocument();
    expect(screen.getByText('individualPrices.nederlands')).toBeInTheDocument();
    // Default = all selected → confirm button shows the full count.
    expect(screen.getByText(/Bevestig 2 wijzigingen/)).toBeInTheDocument();
    expect(screen.getByText(/2 geselecteerd/)).toBeInTheDocument();
  });

  it('toont AI-notitie wanneer notes prop wordt meegegeven', () => {
    render(
      <PriceImportDiffView
        diff={diffRows}
        notes="Prijzen 2026 — bron: prijslijst Q2'
'"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        saving={false}
      />,
    );
    expect(screen.getByText(/AI-notitie:/)).toBeInTheDocument();
  });

  it('"Alles selecteren" toggelt naar 0 en weer naar alles', () => {
    render(
      <PriceImportDiffView
        diff={diffRows}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        saving={false}
      />,
    );
    const toggle = screen.getByLabelText(/Alles selecteren/);
    // First click: deselect all.
    fireEvent.click(toggle);
    expect(screen.getByText(/0 geselecteerd/)).toBeInTheDocument();
    // Bevestig button disabled when 0 selected (singular label).
    const confirmAfterDeselect = screen.getByText(/Bevestig 0 wijzigingen/);
    expect(confirmAfterDeselect).toBeDisabled();
    // Second click: re-select all.
    fireEvent.click(toggle);
    expect(screen.getByText(/2 geselecteerd/)).toBeInTheDocument();
    expect(screen.getByText(/Bevestig 2 wijzigingen/)).toBeInTheDocument();
  });

  it('per-rij checkbox uitvinken update counter en knop-label', () => {
    render(
      <PriceImportDiffView
        diff={diffRows}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        saving={false}
      />,
    );
    // First checkbox is "Alles selecteren"; the per-row checkboxes follow.
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(1 + diffRows.length);
    // Uncheck the first row → counter goes to 1 and label is singular.
    fireEvent.click(checkboxes[1]);
    expect(screen.getByText(/1 geselecteerd/)).toBeInTheDocument();
    expect(screen.getByText(/Bevestig 1 wijziging/)).toBeInTheDocument();
  });

  it('roept onConfirm aan met de juiste set wanneer alles geselecteerd is', () => {
    const onConfirm = vi.fn();
    render(
      <PriceImportDiffView
        diff={diffRows}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        saving={false}
      />,
    );
    fireEvent.click(screen.getByText(/Bevestig 2 wijzigingen/));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    const arg = onConfirm.mock.calls[0]?.[0] as ReadonlySet<string>;
    expect(arg.has('individualPrices.rekenwiskunde')).toBe(true);
    expect(arg.has('individualPrices.nederlands')).toBe(true);
    expect(arg.size).toBe(2);
  });

  it('roept onConfirm alleen met de aangevinkte paden', () => {
    const onConfirm = vi.fn();
    render(
      <PriceImportDiffView
        diff={diffRows}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        saving={false}
      />,
    );
    // Uncheck the second row, keep the first.
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[2]);
    fireEvent.click(screen.getByText(/Bevestig 1 wijziging/));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    const arg = onConfirm.mock.calls[0]?.[0] as ReadonlySet<string>;
    expect(arg.has('individualPrices.rekenwiskunde')).toBe(true);
    expect(arg.has('individualPrices.nederlands')).toBe(false);
    expect(arg.size).toBe(1);
  });

  it('roept onCancel aan bij klik op "Annuleer", niet onConfirm', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <PriceImportDiffView
        diff={diffRows}
        onConfirm={onConfirm}
        onCancel={onCancel}
        saving={false}
      />,
    );
    fireEvent.click(screen.getByText('Annuleer'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('saving=true disabled de confirm-knop en toont "Opslaan…"', () => {
    render(
      <PriceImportDiffView
        diff={diffRows}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        saving={true}
      />,
    );
    const savingBtn = screen.getByText(/Opslaan…/);
    expect(savingBtn).toBeDisabled();
  });
});
