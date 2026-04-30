import { describe, it, expect } from 'vitest';
import { calculateBarLayout } from '../components/PdfBarChart';

describe('calculateBarLayout', () => {
  it('calculates proportional heights for multiple bars', () => {
    const data = [
      { label: 'Cito', value: 1000, color: '#003082' },
      { label: 'DIA', value: 2000, color: '#FF6600' },
      { label: 'JIJ', value: 1500, color: '#4CAF50' },
    ];
    const layout = calculateBarLayout(data, 400, 180);

    expect(layout.bars).toHaveLength(3);
    // Highest value (2000) should have full height
    expect(layout.bars[1].height).toBe(layout.chartHeight);
    // 1000/2000 = 0.5 of chartHeight
    expect(layout.bars[0].height).toBe(layout.chartHeight * 0.5);
    // 1500/2000 = 0.75 of chartHeight
    expect(layout.bars[2].height).toBe(layout.chartHeight * 0.75);
  });

  it('returns empty bars array for empty data', () => {
    const layout = calculateBarLayout([], 400, 180);
    expect(layout.bars).toEqual([]);
    expect(layout.chartHeight).toBeGreaterThan(0);
  });

  it('handles single-item data array', () => {
    const data = [{ label: 'Cito', value: 500, color: '#003082' }];
    const layout = calculateBarLayout(data, 400, 180);

    expect(layout.bars).toHaveLength(1);
    expect(layout.bars[0].height).toBe(layout.chartHeight);
    expect(layout.bars[0].x).toBeGreaterThan(0);
  });

  it('handles zero values gracefully', () => {
    const data = [
      { label: 'Cito', value: 0, color: '#003082' },
      { label: 'DIA', value: 1000, color: '#FF6600' },
    ];
    const layout = calculateBarLayout(data, 400, 180);

    expect(layout.bars[0].height).toBe(0);
    expect(layout.bars[1].height).toBe(layout.chartHeight);
  });

  it('formats values as nl-NL EUR currency', () => {
    const data = [{ label: 'Cito', value: 1234, color: '#003082' }];
    const layout = calculateBarLayout(data, 400, 180);

    // nl-NL EUR format without decimals
    expect(layout.bars[0].formattedValue).toMatch(/1\.234/);
  });

  it('calculates correct bar positions with padding', () => {
    const data = [
      { label: 'A', value: 100, color: '#000' },
      { label: 'B', value: 200, color: '#111' },
    ];
    const layout = calculateBarLayout(data, 400, 180);

    // Second bar should be to the right of first
    expect(layout.bars[1].x).toBeGreaterThan(layout.bars[0].x);
  });
});
