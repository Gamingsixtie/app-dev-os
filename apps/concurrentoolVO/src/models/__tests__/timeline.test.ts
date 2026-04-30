import { describe, it, expect } from 'vitest';
import { buildTimeline } from '@/models/timeline';
import type { TimelineEvent } from '@/models/timeline';
import type { Conversation, SystemEvent } from '@/db/types';

describe('buildTimeline', () => {
  const mockConversation: Conversation = {
    id: 'conv-1',
    schoolId: 'school-1',
    date: '2026-03-15',
    contactId: 'contact-1',
    content: 'Gesprek over prijzen',
    tags: ['prijs'],
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
  };

  const mockSystemEvent: SystemEvent = {
    id: 'evt-1',
    schoolId: 'school-1',
    timestamp: '2026-03-16T12:00:00Z',
    eventType: 'pipeline_changed',
    description: 'Pipeline gewijzigd: prospect -> contact-gelegd',
  };

  it('merges conversations and system events', () => {
    const result = buildTimeline([mockConversation], [mockSystemEvent]);
    expect(result).toHaveLength(2);
  });

  it('sorts events newest-first', () => {
    const result = buildTimeline([mockConversation], [mockSystemEvent]);
    // System event (March 16) should come before conversation (March 15)
    expect(result[0].type).toBe('system');
    expect(result[1].type).toBe('conversation');
  });

  it('returns empty array for empty inputs', () => {
    const result = buildTimeline([], []);
    expect(result).toEqual([]);
  });

  it('handles only conversations', () => {
    const result = buildTimeline([mockConversation], []);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('conversation');
  });

  it('handles only system events', () => {
    const result = buildTimeline([], [mockSystemEvent]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('system');
  });

  it('returns correctly typed TimelineEvent items', () => {
    const result = buildTimeline([mockConversation], [mockSystemEvent]);
    const convEvent = result.find((e): e is Extract<TimelineEvent, { type: 'conversation' }> => e.type === 'conversation');
    const sysEvent = result.find((e): e is Extract<TimelineEvent, { type: 'system' }> => e.type === 'system');
    expect(convEvent?.data.content).toBe('Gesprek over prijzen');
    expect(sysEvent?.data.eventType).toBe('pipeline_changed');
  });
});
