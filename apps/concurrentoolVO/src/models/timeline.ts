import type { Conversation, SystemEvent } from '@/db/types';

export type TimelineEvent =
  | { type: 'conversation'; data: Conversation }
  | { type: 'system'; data: SystemEvent };

export function buildTimeline(
  conversations: Conversation[],
  systemEvents: SystemEvent[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [
    ...conversations.map(c => ({ type: 'conversation' as const, data: c })),
    ...systemEvents.map(e => ({ type: 'system' as const, data: e })),
  ];
  return events.sort((a, b) => {
    const dateA = a.type === 'conversation' ? a.data.date : a.data.timestamp;
    const dateB = b.type === 'conversation' ? b.data.date : b.data.timestamp;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}
