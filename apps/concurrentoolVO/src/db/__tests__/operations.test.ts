/**
 * Operations tests.
 *
 * Note: These operations now use Supabase instead of Dexie.
 * This test only validates `validatePipelineTransition` which is a pure function.
 * The CRUD operations require a Supabase connection and are tested via
 * integration tests or manual verification.
 */
import { describe, expect, it } from 'vitest';
import { validatePipelineTransition } from '../operations';

describe('validatePipelineTransition', () => {
  it('forward is allowed without reason', () => {
    const result = validatePipelineTransition('prospect', 'contact-gelegd');
    expect(result.allowed).toBe(true);
    expect(result.requiresReason).toBe(false);
  });

  it('backward requires reason', () => {
    const result = validatePipelineTransition('offerte', 'prospect');
    expect(result.allowed).toBe(true);
    expect(result.requiresReason).toBe(true);
  });

  it('to verloren requires lost deal info', () => {
    const result = validatePipelineTransition('offerte', 'verloren');
    expect(result.requiresLostDeal).toBe(true);
  });
});
