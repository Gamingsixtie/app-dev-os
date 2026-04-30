import { describe, it, expect } from 'vitest';
import { buildTimeline } from '@/models/timeline';
import type { Conversation, SystemEvent } from '@/db/types';

// Helper to create test conversations
function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: crypto.randomUUID(),
    schoolId: 'school-1',
    date: '2026-03-20',
    contactId: 'c1',
    content: 'Test conversation content',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeSystemEvent(overrides: Partial<SystemEvent> = {}): SystemEvent {
  return {
    id: crypto.randomUUID(),
    schoolId: 'school-1',
    timestamp: '2026-03-20T10:00:00Z',
    eventType: 'school_created',
    description: 'School aangemaakt',
    ...overrides,
  };
}

describe('buildTimeline', () => {
  it('sorts events newest first', () => {
    const conversations = [
      makeConversation({ date: '2026-03-18' }),
      makeConversation({ date: '2026-03-20' }),
      makeConversation({ date: '2026-03-15' }),
    ];

    const result = buildTimeline(conversations, []);

    expect(result).toHaveLength(3);
    expect((result[0].data as Conversation).date).toBe('2026-03-20');
    expect((result[1].data as Conversation).date).toBe('2026-03-18');
    expect((result[2].data as Conversation).date).toBe('2026-03-15');
  });

  it('handles mixed conversation and system events', () => {
    const conversations = [
      makeConversation({ date: '2026-03-19' }),
    ];
    const systemEvents = [
      makeSystemEvent({ timestamp: '2026-03-20T14:00:00Z', eventType: 'pipeline_changed', description: 'Pipeline gewijzigd' }),
      makeSystemEvent({ timestamp: '2026-03-18T09:00:00Z', eventType: 'school_created', description: 'School aangemaakt' }),
    ];

    const result = buildTimeline(conversations, systemEvents);

    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('system');
    expect(result[0].data.id).toBe(systemEvents[0].id);
    expect(result[1].type).toBe('conversation');
    expect(result[2].type).toBe('system');
  });

  it('returns empty array when no events', () => {
    const result = buildTimeline([], []);
    expect(result).toHaveLength(0);
  });
});

describe('TagInput duplicate prevention', () => {
  it('normalizes tags to lowercase and prevents duplicates', () => {
    // Simulate the logic from TagInput
    const addTag = (value: string[], tag: string): string[] => {
      const normalized = tag.toLowerCase().trim();
      if (!normalized) return value;
      if (value.includes(normalized)) return value;
      return [...value, normalized];
    };

    let tags: string[] = [];
    tags = addTag(tags, 'Pricing');
    expect(tags).toEqual(['pricing']);

    tags = addTag(tags, 'pricing');
    expect(tags).toEqual(['pricing']); // No duplicate

    tags = addTag(tags, 'PRICING');
    expect(tags).toEqual(['pricing']); // Case-insensitive duplicate

    tags = addTag(tags, 'Demo');
    expect(tags).toEqual(['pricing', 'demo']);
  });

  it('ignores empty and whitespace-only tags', () => {
    const addTag = (value: string[], tag: string): string[] => {
      const normalized = tag.toLowerCase().trim();
      if (!normalized) return value;
      if (value.includes(normalized)) return value;
      return [...value, normalized];
    };

    let tags: string[] = [];
    tags = addTag(tags, '');
    expect(tags).toEqual([]);

    tags = addTag(tags, '   ');
    expect(tags).toEqual([]);
  });
});

describe('Search filtering', () => {
  it('matches conversation content', () => {
    const conversations = [
      makeConversation({ content: 'Besproken: prijzen nieuwe licentie' }),
      makeConversation({ content: 'Demo ingepland voor volgende week' }),
    ];

    const events = buildTimeline(conversations, []);

    const matchesSearch = (event: (typeof events)[0], query: string) => {
      const q = query.toLowerCase();
      if (event.type === 'conversation') {
        return event.data.content.toLowerCase().includes(q);
      }
      return event.data.description.toLowerCase().includes(q);
    };

    const filtered = events.filter(e => matchesSearch(e, 'prijzen'));
    expect(filtered).toHaveLength(1);
    expect((filtered[0].data as Conversation).content).toContain('prijzen');
  });

  it('matches tag values', () => {
    const conversations = [
      makeConversation({ tags: ['pricing', 'demo'] }),
      makeConversation({ tags: ['introductie'] }),
    ];

    const events = buildTimeline(conversations, []);

    const matchesSearch = (event: (typeof events)[0], query: string) => {
      const q = query.toLowerCase();
      if (event.type === 'conversation') {
        if (event.data.tags.some(t => t.toLowerCase().includes(q))) return true;
        return event.data.content.toLowerCase().includes(q);
      }
      return event.data.description.toLowerCase().includes(q);
    };

    const filtered = events.filter(e => matchesSearch(e, 'demo'));
    expect(filtered).toHaveLength(1);
  });

  it('matches system event description', () => {
    const systemEvents = [
      makeSystemEvent({ description: 'Pipeline gewijzigd: Prospect -> Contact gelegd' }),
      makeSystemEvent({ description: 'School aangemaakt' }),
    ];

    const events = buildTimeline([], systemEvents);

    const matchesSearch = (event: (typeof events)[0], query: string) => {
      const q = query.toLowerCase();
      if (event.type === 'system') {
        return event.data.description.toLowerCase().includes(q);
      }
      return false;
    };

    const filtered = events.filter(e => matchesSearch(e, 'pipeline'));
    expect(filtered).toHaveLength(1);
  });
});
