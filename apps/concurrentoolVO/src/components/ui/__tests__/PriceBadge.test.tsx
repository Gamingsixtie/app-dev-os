import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PriceBadge } from '../PriceBadge';
import type { PriceRecord } from '../../../models/pricing';

function makeRecord(overrides: Partial<PriceRecord> = {}): PriceRecord {
  return {
    moduleId: 'reken-wiskunde',
    provider: 'cito',
    amountPerStudent: 5.5,
    source: 'publication',
    sourceLabel: 'Publicatieprijs 2025',
    verifiedAt: new Date('2026-03-01'),
    isPublicationPrice: true,
    ...overrides,
  };
}

const NOW = new Date('2026-03-20');

describe('PriceBadge', () => {
  it('renders Geverifieerd for recent publication price', () => {
    const record = makeRecord({ verifiedAt: new Date('2026-03-01') });
    render(<PriceBadge record={record} now={NOW} />);
    expect(screen.getByText('Geverifieerd')).toBeInTheDocument();
  });

  it('renders Handmatig for manual price', () => {
    const record = makeRecord({ source: 'manual', sourceLabel: 'Handmatig ingevoerd', verifiedAt: new Date('2026-03-01') });
    render(<PriceBadge record={record} now={NOW} />);
    expect(screen.getByText('Handmatig')).toBeInTheDocument();
  });

  it('renders Mogelijk verouderd for stale price', () => {
    const record = makeRecord({ verifiedAt: new Date('2025-06-01') });
    render(<PriceBadge record={record} now={NOW} />);
    expect(screen.getByText('Mogelijk verouderd')).toBeInTheDocument();
  });

  it('stale badge has tooltip with verification date', () => {
    const record = makeRecord({ verifiedAt: new Date('2025-06-01') });
    render(<PriceBadge record={record} now={NOW} />);
    const badge = screen.getByText('Mogelijk verouderd');
    expect(badge.closest('[title]')).not.toBeNull();
    const titleEl = badge.closest('[title]')!;
    expect(titleEl.getAttribute('title')).toContain('Laatst geverifieerd:');
  });

  it('verified badge has green styling', () => {
    const record = makeRecord({ verifiedAt: new Date('2026-03-01') });
    render(<PriceBadge record={record} now={NOW} />);
    const badge = screen.getByText('Geverifieerd');
    expect(badge.className).toContain('bg-status-verified-bg');
  });

  it('stale badge has orange styling', () => {
    const record = makeRecord({ verifiedAt: new Date('2025-06-01') });
    render(<PriceBadge record={record} now={NOW} />);
    const badge = screen.getByText('Mogelijk verouderd');
    expect(badge.closest('[title]')!.className).toContain('bg-status-stale-bg');
  });
});
