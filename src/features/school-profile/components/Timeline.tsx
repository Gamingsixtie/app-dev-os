import { useMemo } from 'react';
import type { TimelineEvent } from '@/models/timeline';
// buildTimeline available from '@/models/timeline' if needed
import type { Contact, Conversation } from '@/db/types';
import TimelineEntry from '@/features/school-profile/components/TimelineEntry';

interface TimelineProps {
  events: TimelineEvent[];
  contacts: Contact[];
  searchQuery: string;
  onEditConversation: (c: Conversation) => void;
  onCreateAction: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
}

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function getEventDate(event: TimelineEvent): string {
  if (event.type === 'conversation') return event.data.date;
  return event.data.timestamp.slice(0, 10); // ISO date part
}

function matchesSearch(
  event: TimelineEvent,
  query: string,
  contacts: Contact[],
): boolean {
  if (!query) return true;
  const q = query.toLowerCase();

  if (event.type === 'conversation') {
    const conv = event.data;
    if (conv.content.toLowerCase().includes(q)) return true;
    if (conv.tags.some(t => t.toLowerCase().includes(q))) return true;
    const contact = contacts.find(c => c.id === conv.contactId);
    if (contact?.name.toLowerCase().includes(q)) return true;
    return false;
  }

  // System event
  return event.data.description.toLowerCase().includes(q);
}

export default function Timeline({
  events,
  contacts,
  searchQuery,
  onEditConversation,
  onCreateAction,
  onDeleteConversation,
}: TimelineProps) {
  const filtered = useMemo(
    () => events.filter(e => matchesSearch(e, searchQuery, contacts)),
    [events, searchQuery, contacts],
  );

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; label: string; events: TimelineEvent[] }[] = [];
    let currentDate = '';

    for (const event of filtered) {
      const eventDate = getEventDate(event);
      if (eventDate !== currentDate) {
        currentDate = eventDate;
        const label = dateFormatter.format(new Date(eventDate));
        groups.push({ date: eventDate, label, events: [event] });
      } else {
        groups[groups.length - 1].events.push(event);
      }
    }

    return groups;
  }, [filtered]);

  if (filtered.length === 0 && !searchQuery) {
    return (
      <p className="text-base text-neutral-500">
        Nog geen gesprekken. Leg uw eerste gesprek vast.
      </p>
    );
  }

  if (filtered.length === 0 && searchQuery) {
    return (
      <p className="text-base text-neutral-500">
        Geen resultaten voor &ldquo;{searchQuery}&rdquo;.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Timeline connector line */}
      <div className="absolute left-[14px] sm:left-[20px] top-0 bottom-6 w-[2px] bg-neutral-200" />

      {grouped.map((group, gi) => (
        <div key={group.date}>
          {/* Date header */}
          <div className={`flex items-center gap-3 ${gi > 0 ? 'mt-6' : ''} mb-2`}>
            <span className="text-[14px] font-semibold text-neutral-500 bg-cito-bg px-3 py-1 rounded-full whitespace-nowrap">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {/* Events */}
          <div className="flex flex-col gap-3 mt-3">
            {group.events.map(event => {
              const key =
                event.type === 'conversation'
                  ? event.data.id
                  : event.data.id;

              // Dot color
              const dotColor =
                event.type === 'conversation'
                  ? 'bg-cito-primary'
                  : event.data.eventType === 'pipeline_changed'
                    ? 'bg-purple-600'
                    : event.data.eventType === 'comparison_created'
                      ? 'bg-blue-600'
                      : event.data.eventType === 'prices_updated'
                        ? 'bg-amber-600'
                        : 'bg-green-600';

              return (
                <div key={key} className="relative flex items-start">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-[10px] sm:left-[16px] top-3 w-[8px] h-[8px] rounded-full ${dotColor} z-10`}
                  />
                  <div className="flex-1">
                    <TimelineEntry
                      event={event}
                      contacts={contacts}
                      onEdit={
                        event.type === 'conversation'
                          ? onEditConversation
                          : undefined
                      }
                      onCreateAction={
                        event.type === 'conversation'
                          ? onCreateAction
                          : undefined
                      }
                      onDelete={
                        event.type === 'conversation'
                          ? onDeleteConversation
                          : undefined
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
