import { useMemo, useState } from 'react';
import type { Contact, Conversation, SystemEvent } from '@/db/types';
import type { DMUPosition } from '@/models/school';
import DMUBadge from '@/components/ui/DMUBadge';
import EventRegistrationForm from './EventRegistrationForm';

// ─── Timeline entry types ─────────────────────────────────────────────────────

type JourneyEntryType = 'conversation' | 'blokkade' | 'status_change' | 'first_contact' | 'demo' | 'offerte' | 'beslissing' | 'contract' | 'implementatie' | 'evaluatie';

interface JourneyEntry {
  id: string;
  date: string;
  type: JourneyEntryType;
  contactId?: string;
  contactName?: string;
  contactDmuPosition?: DMUPosition;
  description: string;
}

// ─── Timeline building logic ──────────────────────────────────────────────────

function buildJourneyTimeline(
  conversations: Conversation[],
  systemEvents: SystemEvent[],
  contacts: Contact[],
): JourneyEntry[] {
  const contactMap = new Map(contacts.map(c => [c.id, c]));
  const entries: JourneyEntry[] = [];

  // Track earliest conversation date per contact for first_contact marking
  const firstConversationDates = new Map<string, string>();
  for (const conv of conversations) {
    const existing = firstConversationDates.get(conv.contactId);
    if (!existing || conv.date < existing) {
      firstConversationDates.set(conv.contactId, conv.date);
    }
  }

  // Map conversations to timeline entries
  for (const conv of conversations) {
    const contact = contactMap.get(conv.contactId);
    const isFirst = firstConversationDates.get(conv.contactId) === conv.date;

    entries.push({
      id: `conv-${conv.id}`,
      date: conv.date,
      type: isFirst ? 'first_contact' : 'conversation',
      contactId: conv.contactId,
      contactName: contact?.name,
      contactDmuPosition: contact?.dmuPosition,
      description: conv.content.length > 120
        ? conv.content.slice(0, 120) + '...'
        : conv.content,
    });
  }

  // Map system events to timeline entries
  for (const event of systemEvents) {
    if (event.eventType === 'blokkade_registered') {
      entries.push({
        id: `evt-${event.id}`,
        date: event.timestamp,
        type: 'blokkade',
        contactId: event.metadata?.contactId,
        contactName: event.metadata?.contactName,
        contactDmuPosition: event.metadata?.contactId
          ? contactMap.get(event.metadata.contactId)?.dmuPosition
          : undefined,
        description: event.description,
      });
    } else if (event.eventType === 'engagement_changed') {
      entries.push({
        id: `evt-${event.id}`,
        date: event.timestamp,
        type: 'status_change',
        contactId: event.metadata?.contactId,
        contactName: event.metadata?.contactName,
        contactDmuPosition: event.metadata?.contactId
          ? contactMap.get(event.metadata.contactId)?.dmuPosition
          : undefined,
        description: event.description,
      });
    } else if (event.eventType === 'demo_gegeven') {
      entries.push({
        id: `evt-${event.id}`,
        date: event.timestamp,
        type: 'demo',
        contactId: event.metadata?.contactId,
        contactName: event.metadata?.contactName,
        contactDmuPosition: event.metadata?.contactId ? contactMap.get(event.metadata.contactId)?.dmuPosition : undefined,
        description: event.description,
      });
    } else if (event.eventType === 'offerte_verstuurd') {
      entries.push({
        id: `evt-${event.id}`,
        date: event.timestamp,
        type: 'offerte',
        contactId: event.metadata?.contactId,
        contactName: event.metadata?.contactName,
        contactDmuPosition: event.metadata?.contactId ? contactMap.get(event.metadata.contactId)?.dmuPosition : undefined,
        description: event.description,
      });
    } else if (event.eventType === 'beslissing_genomen') {
      entries.push({
        id: `evt-${event.id}`,
        date: event.timestamp,
        type: 'beslissing',
        contactId: event.metadata?.contactId,
        contactName: event.metadata?.contactName,
        contactDmuPosition: event.metadata?.contactId ? contactMap.get(event.metadata.contactId)?.dmuPosition : undefined,
        description: event.description,
      });
    } else if (event.eventType === 'contract_getekend') {
      entries.push({
        id: `evt-${event.id}`,
        date: event.timestamp,
        type: 'contract',
        contactId: event.metadata?.contactId,
        contactName: event.metadata?.contactName,
        contactDmuPosition: event.metadata?.contactId ? contactMap.get(event.metadata.contactId)?.dmuPosition : undefined,
        description: event.description,
      });
    } else if (event.eventType === 'implementatie_gestart') {
      entries.push({
        id: `evt-${event.id}`,
        date: event.timestamp,
        type: 'implementatie',
        contactId: event.metadata?.contactId,
        contactName: event.metadata?.contactName,
        contactDmuPosition: event.metadata?.contactId ? contactMap.get(event.metadata.contactId)?.dmuPosition : undefined,
        description: event.description,
      });
    } else if (event.eventType === 'evaluatie_gepland') {
      entries.push({
        id: `evt-${event.id}`,
        date: event.timestamp,
        type: 'evaluatie',
        contactId: event.metadata?.contactId,
        contactName: event.metadata?.contactName,
        contactDmuPosition: event.metadata?.contactId ? contactMap.get(event.metadata.contactId)?.dmuPosition : undefined,
        description: event.description,
      });
    }
    // Skip other system events (pipeline_changed, etc.) — not relevant for customer journey
  }

  // Sort chronologically (newest first)
  entries.sort((a, b) => b.date.localeCompare(a.date));
  return entries;
}

// ─── Entry type styles ────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<JourneyEntryType, { borderColor: string; dotColor: string }> = {
  conversation: { borderColor: 'border-l-blue-400', dotColor: 'bg-blue-400' },
  blokkade: { borderColor: 'border-l-red-400', dotColor: 'bg-red-400' },
  status_change: { borderColor: 'border-l-neutral-300', dotColor: 'bg-neutral-300' },
  first_contact: { borderColor: 'border-l-green-400', dotColor: 'bg-green-400' },
  demo: { borderColor: 'border-l-purple-400', dotColor: 'bg-purple-400' },
  offerte: { borderColor: 'border-l-blue-500', dotColor: 'bg-blue-500' },
  beslissing: { borderColor: 'border-l-amber-400', dotColor: 'bg-amber-400' },
  contract: { borderColor: 'border-l-green-500', dotColor: 'bg-green-500' },
  implementatie: { borderColor: 'border-l-teal-400', dotColor: 'bg-teal-400' },
  evaluatie: { borderColor: 'border-l-indigo-400', dotColor: 'bg-indigo-400' },
};

// Inline SVG icons per type
function TypeIcon({ type }: { type: JourneyEntryType }) {
  const cls = 'w-4 h-4 text-neutral-500 flex-shrink-0';
  switch (type) {
    case 'conversation':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none">
          <path d="M2 3h12v7H5l-3 3V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'blokkade':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none">
          <path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'status_change':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'first_contact':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none">
          <path d="M8 2l1.5 3.5L13 6l-2.5 2.5.5 3.5L8 10.5 5 12l.5-3.5L3 6l3.5-.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'demo':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M7 6v3l2.5-1.5L7 6z" fill="currentColor" />
        </svg>
      );
    case 'offerte':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none">
          <path d="M4 2h8v12H4V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M6 5h4M6 7.5h4M6 10h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'beslissing':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none">
          <path d="M8 2v4M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'contract':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none">
          <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'implementatie':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'evaluatie':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 8h4M8 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

// ─── Single timeline entry component ──────────────────────────────────────────

function JourneyEntryCard({ entry }: { entry: JourneyEntry }) {
  const { borderColor, dotColor } = TYPE_CONFIG[entry.type];
  const isBlokkade = entry.type === 'blokkade';

  return (
    <li className="relative ml-8 md:ml-10">
      {/* Dot on timeline line */}
      <div
        className={`absolute -left-[26px] md:-left-[30px] top-4 w-3 h-3 rounded-full ${dotColor} ring-2 ring-white`}
      />

      {/* Date label */}
      <p className="text-[12px] text-neutral-400 mb-1">
        {dateFormatter.format(new Date(entry.date))}
      </p>

      {/* Entry card */}
      <div
        className={`border-l-4 ${borderColor} rounded-lg p-4 ${
          isBlokkade
            ? 'bg-red-50 border border-red-200'
            : 'bg-white border border-neutral-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <TypeIcon type={entry.type} />
          {entry.contactName && (
            <span className="text-[14px] font-semibold text-neutral-900">
              {entry.contactName}
            </span>
          )}
          {entry.contactDmuPosition && (
            <DMUBadge position={entry.contactDmuPosition} />
          )}
        </div>
        <p className="text-[14px] text-neutral-700">{entry.description}</p>
      </div>
    </li>
  );
}

// ─── Main timeline component ──────────────────────────────────────────────────

interface CustomerJourneyTimelineProps {
  schoolId: string;
  contacts: Contact[];
  conversations: Conversation[];
  systemEvents: SystemEvent[];
}

export default function CustomerJourneyTimeline({
  schoolId,
  contacts,
  conversations,
  systemEvents,
}: CustomerJourneyTimelineProps) {
  const [showEventForm, setShowEventForm] = useState(false);

  const entries = useMemo(
    () => buildJourneyTimeline(conversations, systemEvents, contacts),
    [conversations, systemEvents, contacts],
  );

  if (entries.length === 0 && !showEventForm) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
        <p className="text-[16px] font-semibold text-neutral-700 mb-1">
          Geen klantreis-historie
        </p>
        <p className="text-[14px] text-neutral-500">
          De klantreis wordt opgebouwd uit gesprekken en statuswijzigingen. Voeg een gesprek toe of registreer een gebeurtenis om te beginnen.
        </p>
        <button
          type="button"
          onClick={() => setShowEventForm(true)}
          className="mt-4 text-[14px] font-semibold text-cito-accent hover:text-orange-700"
          aria-expanded={showEventForm}
        >
          + Gebeurtenis registreren
        </button>
        {showEventForm && (
          <EventRegistrationForm
            schoolId={schoolId}
            contacts={contacts}
            onSaved={() => setShowEventForm(false)}
            onCancel={() => setShowEventForm(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Timeline */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[18px] md:left-[22px] top-0 bottom-0 w-0.5 bg-neutral-200" />

        <ol className="space-y-4" role="list">
          {entries.map(entry => (
            <JourneyEntryCard key={entry.id} entry={entry} />
          ))}
        </ol>
      </div>

      {/* Event registration button */}
      <div className="mt-4">
        {showEventForm ? (
          <EventRegistrationForm
            schoolId={schoolId}
            contacts={contacts}
            onSaved={() => setShowEventForm(false)}
            onCancel={() => setShowEventForm(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowEventForm(true)}
            className="text-[14px] font-semibold text-cito-accent hover:text-orange-700"
            aria-expanded={showEventForm}
          >
            + Gebeurtenis registreren
          </button>
        )}
      </div>
    </div>
  );
}

// Export buildJourneyTimeline for testing
export { buildJourneyTimeline };
export type { JourneyEntry, JourneyEntryType };
