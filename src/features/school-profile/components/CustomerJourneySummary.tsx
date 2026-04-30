import { useMemo } from 'react';
import type { Contact, Conversation, SystemEvent } from '@/db/types';
import DMUBadge from '@/components/ui/DMUBadge';
import EngagementBadge from '@/components/ui/EngagementBadge';

interface CustomerJourneySummaryProps {
  contacts: Contact[];
  conversations: Conversation[];
  systemEvents: SystemEvent[];
}

/**
 * Compact dashboard card showing:
 * 1. Eerste aanspreekpunt (earliest conversation contact)
 * 2. Beslisser (first contact with beslisser role + their engagement status)
 * 3. DMU-bereik (X of Y reached with progress bar)
 * 4. Huidige blokkade (latest unresolved blokkade)
 */
export default function CustomerJourneySummary({
  contacts,
  conversations,
  systemEvents,
}: CustomerJourneySummaryProps) {
  // Find the first point of contact (earliest conversation date)
  const firstContact = useMemo(() => {
    if (conversations.length === 0) return null;
    const earliest = conversations.reduce((prev, curr) =>
      curr.date < prev.date ? curr : prev,
    );
    return contacts.find(c => c.id === earliest.contactId) ?? null;
  }, [contacts, conversations]);

  // Find the beslisser
  const beslisser = useMemo(
    () => contacts.find(c => c.dmuPosition === 'beslisser') ?? null,
    [contacts],
  );

  // DMU reach: count contacts with positive engagement
  const dmuReach = useMemo(() => {
    const total = contacts.length;
    const reached = contacts.filter(
      c => c.engagementStatus === 'positief' || c.engagementStatus === 'akkoord',
    ).length;
    return { reached, total };
  }, [contacts]);

  // Latest unresolved blokkade
  const currentBlokkade = useMemo(() => {
    const blokkades = systemEvents
      .filter(e => e.eventType === 'blokkade_registered' && e.metadata?.resolved !== 'true')
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return blokkades[0] ?? null;
  }, [systemEvents]);

  const reachPercent = dmuReach.total > 0
    ? Math.round((dmuReach.reached / dmuReach.total) * 100)
    : 0;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
      <h2 className="text-[20px] font-semibold text-neutral-900 mb-4">
        Klantreis-overzicht
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Eerste aanspreekpunt */}
        <div>
          <p className="text-[12px] text-neutral-500 uppercase tracking-wide mb-1">
            Eerste aanspreekpunt
          </p>
          {firstContact ? (
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-neutral-900">
                {firstContact.name}
              </span>
              <DMUBadge position={firstContact.dmuPosition} />
            </div>
          ) : (
            <p className="text-[14px] text-neutral-400">Niet vastgelegd</p>
          )}
        </div>

        {/* 2. Beslisser */}
        <div>
          <p className="text-[12px] text-neutral-500 uppercase tracking-wide mb-1">
            Beslisser
          </p>
          {beslisser ? (
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-neutral-900">
                {beslisser.name}
              </span>
              <EngagementBadge status={beslisser.engagementStatus} size="sm" />
            </div>
          ) : (
            <p className="text-[14px] text-neutral-400">Niet vastgelegd</p>
          )}
        </div>

        {/* 3. DMU-bereik */}
        <div>
          <p className="text-[12px] text-neutral-500 uppercase tracking-wide mb-1">
            DMU-bereik
          </p>
          <p className="text-[14px] font-semibold text-neutral-900">
            {dmuReach.reached} van {dmuReach.total} bereikt
          </p>
          <div
            className="mt-1 h-2 w-full rounded-full bg-neutral-200 overflow-hidden"
            role="progressbar"
            aria-label={`DMU bereik: ${dmuReach.reached} van ${dmuReach.total}`}
            aria-valuenow={dmuReach.reached}
            aria-valuemin={0}
            aria-valuemax={dmuReach.total}
          >
            <div
              className="h-full rounded-full bg-cito-primary transition-all"
              style={{ width: `${reachPercent}%` }}
            />
          </div>
        </div>

        {/* 4. Huidige blokkade */}
        <div>
          <p className="text-[12px] text-neutral-500 uppercase tracking-wide mb-1">
            Huidige blokkade
          </p>
          {currentBlokkade ? (
            <p className="text-[14px] font-semibold text-red-600 truncate">
              {currentBlokkade.description}
            </p>
          ) : (
            <p className="text-[14px] text-neutral-400">Geen blokkades</p>
          )}
        </div>
      </div>
    </div>
  );
}
