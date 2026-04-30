import { describe, it, expect } from 'vitest';
import { determineSalesSignal } from '../sales-signals';

describe('determineSalesSignal', () => {
  it('Test 1: Cito 4.50 vs DIA 5.20 -> emphasize-price, green', () => {
    const result = determineSalesSignal(
      4.50,
      5.20,
      ['Adaptieve toetsafname'],
      ['Breed genormeerd'],
    );

    expect(result).not.toBeNull();
    expect(result!.type).toBe('emphasize-price');
    expect(result!.color).toBe('green');
    expect(result!.label).toBe('Benadruk prijs');
  });

  it('Test 2: Cito 6.50 vs DIA 4.00, Cito has differentiators -> focus-value, yellow', () => {
    const result = determineSalesSignal(
      6.50,
      4.00,
      ['Wetenschappelijk gevalideerd instrument'],
      ['Onderdeel van breed SEL-aanbod'],
    );

    expect(result).not.toBeNull();
    expect(result!.type).toBe('focus-value');
    expect(result!.color).toBe('yellow');
    expect(result!.label).toBe('Focus op meerwaarde');
  });

  it('Test 3: Cito 6.50 vs DIA 4.00, Cito has NO differentiators -> vulnerable, red', () => {
    const result = determineSalesSignal(
      6.50,
      4.00,
      [], // no Cito differentiators
      ['Breed genormeerd'],
    );

    expect(result).not.toBeNull();
    expect(result!.type).toBe('vulnerable');
    expect(result!.color).toBe('red');
    expect(result!.label).toBe('Kwetsbaar punt');
  });

  it('Test 4: Cito equal to competitor -> emphasize-price', () => {
    const result = determineSalesSignal(
      5.20,
      5.20,
      ['Adaptieve toetsafname'],
      ['Breed genormeerd'],
    );

    expect(result).not.toBeNull();
    expect(result!.type).toBe('emphasize-price');
    expect(result!.color).toBe('green');
  });

  it('Test 5: Either cost is null -> returns null', () => {
    expect(determineSalesSignal(null, 5.20, [], [])).toBeNull();
    expect(determineSalesSignal(4.50, null, [], [])).toBeNull();
    expect(determineSalesSignal(null, null, [], [])).toBeNull();
  });

  it('Test 6: determineSalesSignal returns a description string in Dutch', () => {
    const green = determineSalesSignal(4.50, 5.20, [], []);
    expect(green).not.toBeNull();
    expect(green!.description).toContain('Cito');
    expect(typeof green!.description).toBe('string');
    expect(green!.description.length).toBeGreaterThan(10);

    const yellow = determineSalesSignal(6.50, 4.00, ['Adaptief'], []);
    expect(yellow).not.toBeNull();
    expect(yellow!.description).toContain('meerwaarde');

    const red = determineSalesSignal(6.50, 4.00, [], []);
    expect(red).not.toBeNull();
    expect(red!.description).toContain('Cito');
  });
});
