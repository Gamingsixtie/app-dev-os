import { describe, it, expect } from 'vitest';
import { detectExistingIntake } from '../intake-guard';
import type { Conversation } from '@/db/types';

// Minimal mock for store state shape
function makeStoreState(overrides: { levels?: string[]; moduleSetups?: { moduleId: string }[] } = {}) {
  return {
    levels: overrides.levels ?? [],
    moduleSetups: overrides.moduleSetups ?? [],
    // Other fields from the store (not used by detectExistingIntake)
  } as any;
}

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    schoolId: 's1',
    date: '2026-03-01',
    type: 'call',
    summary: 'Test',
    tags: [],
    contactId: null,
    aiGenerated: false,
    ...overrides,
  } as Conversation;
}

describe('detectExistingIntake', () => {
  it('returns source "none" with no wizard data and no conversations', () => {
    const result = detectExistingIntake(makeStoreState(), []);

    expect(result.source).toBe('none');
    expect(result.hasWizardData).toBe(false);
    expect(result.hasConversationIntake).toBe(false);
    expect(result.lastIntakeDate).toBeNull();
  });

  it('returns source "wizard" when levels exist but no intake conversations', () => {
    const result = detectExistingIntake(
      makeStoreState({ levels: ['havo'] }),
      [],
    );

    expect(result.source).toBe('wizard');
    expect(result.hasWizardData).toBe(true);
    expect(result.hasConversationIntake).toBe(false);
  });

  it('returns source "wizard" when moduleSetups exist', () => {
    const result = detectExistingIntake(
      makeStoreState({ moduleSetups: [{ moduleId: 'rekenwiskunde' }] }),
      [],
    );

    expect(result.source).toBe('wizard');
    expect(result.hasWizardData).toBe(true);
  });

  it('returns source "conversation" when ai-intake tagged conversation exists', () => {
    const convos = [makeConversation({ tags: ['ai-intake'], date: '2026-03-15' })];
    const result = detectExistingIntake(makeStoreState(), convos);

    expect(result.source).toBe('conversation');
    expect(result.hasConversationIntake).toBe(true);
    expect(result.lastIntakeDate).toBe('2026-03-15');
  });

  it('returns source "conversation" with ai-intake-wizard tag', () => {
    const convos = [makeConversation({ tags: ['ai-intake-wizard'], date: '2026-03-10' })];
    const result = detectExistingIntake(makeStoreState(), convos);

    expect(result.source).toBe('conversation');
    expect(result.hasConversationIntake).toBe(true);
  });

  it('returns source "both" when wizard data AND intake conversation exist', () => {
    const convos = [makeConversation({ tags: ['ai-intake'], date: '2026-03-15' })];
    const result = detectExistingIntake(
      makeStoreState({ levels: ['vwo'] }),
      convos,
    );

    expect(result.source).toBe('both');
    expect(result.hasWizardData).toBe(true);
    expect(result.hasConversationIntake).toBe(true);
  });

  it('ignores conversations without ai-intake tags', () => {
    const convos = [makeConversation({ tags: ['general', 'follow-up'] })];
    const result = detectExistingIntake(makeStoreState(), convos);

    expect(result.source).toBe('none');
    expect(result.hasConversationIntake).toBe(false);
  });

  it('returns most recent intake date when multiple intake conversations exist', () => {
    const convos = [
      makeConversation({ tags: ['ai-intake'], date: '2026-03-01' }),
      makeConversation({ tags: ['ai-intake'], date: '2026-03-20' }),
      makeConversation({ tags: ['ai-intake'], date: '2026-03-10' }),
    ];
    const result = detectExistingIntake(makeStoreState(), convos);

    expect(result.lastIntakeDate).toBe('2026-03-20');
  });
});
