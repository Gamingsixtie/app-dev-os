import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ComparisonChart } from '../ComparisonChart';
import type { ComparisonResult } from '../../../engine/price-comparison';
import type { PriceRecord } from '../../../models/pricing';

const makePriceRecord = (
  moduleId: string,
  provider: 'cito' | 'dia' | 'jij',
  amount: number,
): PriceRecord => ({
  moduleId,
  provider,
  amountPerStudent: amount,
  source: 'publication',
  sourceLabel: 'Test',
  verifiedAt: new Date('2026-01-15'),
  isPublicationPrice: true,
});

const mockResult: ComparisonResult = {
  modules: [
    {
      moduleId: 'rekenwiskunde',
      moduleName: 'Rekenwiskunde',
      moduleCategory: 'leerlingvolgsysteem',
      providers: {
        cito: {
          pricePerStudent: 4.5,
          totalCost: 2025,
          studentCount: 450,
          priceRecord: makePriceRecord('rekenwiskunde', 'cito', 4.5),
          breakdown: [],
        },
        dia: {
          pricePerStudent: 5.2,
          totalCost: 2340,
          studentCount: 450,
          priceRecord: makePriceRecord('rekenwiskunde', 'dia', 5.2),
          breakdown: [],
        },
        jij: {
          pricePerStudent: 4.8,
          totalCost: 2160,
          studentCount: 450,
          priceRecord: makePriceRecord('rekenwiskunde', 'jij', 4.8),
          breakdown: [],
        },
        saqi: null,
      },
    },
    {
      moduleId: 'taalverzorging',
      moduleName: 'Taalverzorging',
      moduleCategory: 'leerlingvolgsysteem',
      providers: {
        cito: {
          pricePerStudent: 3.8,
          totalCost: 1710,
          studentCount: 450,
          priceRecord: makePriceRecord('taalverzorging', 'cito', 3.8),
          breakdown: [],
        },
        dia: null,
        jij: null,
        saqi: null,
      },
    },
  ],
  totals: { cito: 3735, dia: 2340, jij: 2160, saqi: 0 },
  differences: { citoVsDia: 1395, citoVsJij: 1575, citoVsSaqi: null },
  diaPackageResult: null,
};

// Note: Recharts renders to SVG in jsdom which has limited support.
// We test that the component renders without crashing and key elements exist.

describe('ComparisonChart', () => {
  it('renders without crashing with a valid ComparisonResult', () => {
    const { container } = render(<ComparisonChart result={mockResult} />);
    expect(container).toBeTruthy();
  });

  it('renders a responsive container with correct height', () => {
    const { container } = render(<ComparisonChart result={mockResult} />);
    // Recharts ResponsiveContainer renders with 0 width in jsdom,
    // so SVG content (legend, bars) is not rendered. We verify the
    // container is present with the correct height configuration.
    const responsiveContainer = container.querySelector(
      '.recharts-responsive-container',
    );
    expect(responsiveContainer).toBeInTheDocument();
    expect(responsiveContainer).toHaveStyle({ height: '340px' });
  });

  it('handles modules where provider cost is null without crashing', () => {
    // Taalverzorging has null for DIA and JIJ
    const { container } = render(<ComparisonChart result={mockResult} />);
    expect(container).toBeTruthy();
    // Should still render the chart (no exception thrown)
  });

  it('accepts onBarClick callback prop', () => {
    const handleClick = () => {};
    const { container } = render(
      <ComparisonChart result={mockResult} onBarClick={handleClick} />,
    );
    expect(container).toBeTruthy();
  });
});
