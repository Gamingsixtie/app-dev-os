import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrijzenTabs } from '../components/PrijzenTabs';
import { ConcurrentieSubTabs } from '../components/ConcurrentieSubTabs';

describe('PrijzenTabs', () => {
  it('rendert 2 hoofdtabs (Basisvaardigheden + Concurrentie)', () => {
    render(<PrijzenTabs activeTab="basis" onTabChange={() => {}} />);
    expect(screen.getByText('Cito Basisvaardigheden')).toBeInTheDocument();
    expect(screen.getByText('Concurrentie')).toBeInTheDocument();
    expect(screen.queryByText('Cito Modules')).not.toBeInTheDocument();
  });

  it('markeert de actieve tab', () => {
    render(<PrijzenTabs activeTab="concurrentie" onTabChange={() => {}} />);
    const concurrentieBtn = screen.getByText('Concurrentie');
    expect(concurrentieBtn.className).toContain('border-cito-primary');
  });

  it('roept onTabChange aan bij klik', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PrijzenTabs activeTab="basis" onTabChange={onChange} />);
    await user.click(screen.getByText('Concurrentie'));
    expect(onChange).toHaveBeenCalledWith('concurrentie');
  });
});

describe('ConcurrentieSubTabs', () => {
  it('rendert 2 provider-sub-tabs + 3 categorie-sub-tabs (5 totaal)', () => {
    render(<ConcurrentieSubTabs active="dia" onChange={() => {}} />);
    expect(screen.getByText('DIA')).toBeInTheDocument();
    expect(screen.getByText('JIJ!')).toBeInTheDocument();
    expect(screen.getByText('Sociaal-emotioneel')).toBeInTheDocument();
    expect(screen.getByText('Executieve functies')).toBeInTheDocument();
    expect(screen.getByText('Overig')).toBeInTheDocument();
    // SAQI is geen top-level sub-tab meer; verschijnt alleen in 'Sociaal-emotioneel' view.
    expect(screen.queryByText('SAQI')).not.toBeInTheDocument();
  });

  it('markeert de actieve sub-tab (provider)', () => {
    render(<ConcurrentieSubTabs active="jij" onChange={() => {}} />);
    expect(screen.getByText('JIJ!').className).toContain('border-cito-primary');
  });

  it('markeert de actieve sub-tab (categorie)', () => {
    render(<ConcurrentieSubTabs active="sociaal-emotioneel" onChange={() => {}} />);
    expect(screen.getByText('Sociaal-emotioneel').className).toContain('border-cito-primary');
  });

  it('roept onChange aan bij klik op provider', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ConcurrentieSubTabs active="dia" onChange={onChange} />);
    await user.click(screen.getByText('JIJ!'));
    expect(onChange).toHaveBeenCalledWith('jij');
  });

  it('roept onChange aan bij klik op categorie', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ConcurrentieSubTabs active="dia" onChange={onChange} />);
    await user.click(screen.getByText('Executieve functies'));
    expect(onChange).toHaveBeenCalledWith('executieve');
  });
});
