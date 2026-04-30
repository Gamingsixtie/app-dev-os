import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyCompact, formatNumber } from '../format';

describe('formatCurrency', () => {
  it('formats positive amount in Dutch locale', () => {
    const result = formatCurrency(1234.56);
    // Dutch locale uses comma for decimal, period for thousands
    expect(result).toContain('1.234,56');
    expect(result).toContain('€');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0,00');
  });

  it('formats negative amount', () => {
    const result = formatCurrency(-99.99);
    expect(result).toContain('99,99');
  });

  it('formats amount with many decimals to 2 digits', () => {
    const result = formatCurrency(7.985);
    // Should round to 2 decimal places
    expect(result).toMatch(/7,9[89]/);
  });

  it('formats large amounts with thousand separators', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1.000.000');
  });
});

describe('formatCurrencyCompact', () => {
  it('formats without decimal places', () => {
    const result = formatCurrencyCompact(1234.56);
    expect(result).toContain('€');
    expect(result).toContain('1.235'); // rounded up
  });

  it('formats zero', () => {
    const result = formatCurrencyCompact(0);
    expect(result).toContain('0');
  });
});

describe('formatNumber', () => {
  it('formats integer in Dutch locale', () => {
    const result = formatNumber(1234);
    expect(result).toBe('1.234');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('formats large number', () => {
    const result = formatNumber(1000000);
    expect(result).toBe('1.000.000');
  });

  it('formats decimal number', () => {
    const result = formatNumber(3.14);
    expect(result).toContain('3');
    expect(result).toContain('14');
  });
});
