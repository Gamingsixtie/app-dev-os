import { useState, useMemo } from 'react';
import type { Contact, Conversation } from '@/db/types';
import type { PipelineStatus, EngagementStatus } from '@/models/school';
import { STAGNATION_THRESHOLD_DAYS } from '@/models/school';
import DMUBadge from '@/components/ui/DMUBadge';
import EngagementBadge from '@/components/ui/EngagementBadge';
import EngagementStatusSelect from './EngagementStatusSelect';
import WaitingForSelect from './WaitingForSelect';
import DropOffReasonDialog from './DropOffReasonDialog';
import DmuMismatchBanner from './DmuMismatchBanner';
import { useSetEngagementStatus } from '@/hooks/useContacts';

interface DmuMatrixProps {
  schoolId: string;
  contacts: Contact[];
  conversations?: Conversation[];
  pipelineStatus: PipelineStatus;
  onNavigateToPipeline: () => void;
}

/** Calculate days since a given ISO date string */
function daysSince(isoDate: string | null): number {
  if (!isoDate) return 0;
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

/** Compute contact order based on earliest conversation date */
function getContactOrder(conversations: Conversation[]): Map<string, number> {
  const firstDates = new Map<string, string>();
  for (const conv of conversations) {
    const existing = firstDates.get(conv.contactId);
    if (!existing || conv.date < existing) {
      firstDates.set(conv.contactId, conv.date);
    }
  }

  const sorted = [...firstDates.entries()]
    .sort(([, a], [, b]) => a.localeCompare(b));

  const orderMap = new Map<string, number>();
  sorted.forEach(([contactId], index) => {
    orderMap.set(contactId, index + 1);
  });
  return orderMap;
}

/** Format ordinal in Dutch: 1e, 2e, 3e, etc. */
function formatOrdinal(n: number): string {
  return `${n}e`;
}

export default function DmuMatrix({
  schoolId,
  contacts,
  conversations = [],
  pipelineStatus,
  onNavigateToPipeline,
}: DmuMatrixProps) {
  const setEngagement = useSetEngagementStatus();
  const [pendingDropOff, setPendingDropOff] = useState<Contact | null>(null);

  const contactOrder = useMemo(
    () => getContactOrder(conversations),
    [conversations],
  );

  const handleStatusChange = (contact: Contact, newStatus: EngagementStatus) => {
    if (newStatus === 'afgehaakt') {
      setPendingDropOff(contact);
      return;
    }
    setEngagement.mutate({
      schoolId,
      contactId: contact.id,
      status: newStatus,
    });
  };

  const handleDropOffConfirm = (reason: string) => {
    if (!pendingDropOff) return;
    setEngagement.mutate({
      schoolId,
      contactId: pendingDropOff.id,
      status: 'afgehaakt',
      options: { dropOffReason: reason },
    });
    setPendingDropOff(null);
  };

  const handleWaitingForChange = (contact: Contact, waitingForId: string | null) => {
    setEngagement.mutate({
      schoolId,
      contactId: contact.id,
      status: 'wacht-op-intern',
      options: { waitingForContactId: waitingForId },
    });
  };

  // Empty state
  if (contacts.length === 0) {
    return (
      <div className="mt-6">
        <h2 className="text-[20px] font-semibold text-neutral-900 mb-4">
          DMU-beslissingsoverzicht
        </h2>
        <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
          <p className="text-[16px] font-semibold text-neutral-700 mb-1">
            Geen contactpersonen
          </p>
          <p className="text-[14px] text-neutral-500">
            Voeg contactpersonen toe via de Contacten-tab om het DMU-beslissingsoverzicht te gebruiken.
          </p>
        </div>
      </div>
    );
  }

  const authorityLabel = (authority: string) =>
    authority.charAt(0).toUpperCase() + authority.slice(1);

  return (
    <div className="mt-6">
      <h2 className="text-[20px] font-semibold text-neutral-900 mb-4">
        DMU-beslissingsoverzicht
      </h2>

      <DmuMismatchBanner
        contacts={contacts}
        pipelineStatus={pipelineStatus}
        onNavigateToPipeline={onNavigateToPipeline}
      />

      {/* Desktop/Tablet: table view */}
      <div className="hidden md:block bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50">
              <th className="text-left text-[14px] font-semibold text-neutral-700 px-4 py-3" style={{ minWidth: 120 }}>
                Naam
              </th>
              <th className="text-left text-[14px] font-semibold text-neutral-700 px-4 py-3" style={{ minWidth: 100 }}>
                Functie
              </th>
              <th className="text-left text-[14px] font-semibold text-neutral-700 px-4 py-3" style={{ width: 48 }}>
                Nr.
              </th>
              <th className="text-left text-[14px] font-semibold text-neutral-700 px-4 py-3" style={{ width: 100 }}>
                DMU-rol
              </th>
              <th className="text-left text-[14px] font-semibold text-neutral-700 px-4 py-3" style={{ width: 100 }}>
                Bevoegdheid
              </th>
              <th className="text-left text-[14px] font-semibold text-neutral-700 px-4 py-3" style={{ width: 140 }}>
                Status
              </th>
              <th className="text-left text-[14px] font-semibold text-neutral-700 px-4 py-3" style={{ minWidth: 100 }}>
                Wacht op
              </th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => {
              const stagnationDays = daysSince(contact.engagementStatusChangedAt);
              const isStagnating = stagnationDays >= STAGNATION_THRESHOLD_DAYS;
              const order = contactOrder.get(contact.id);

              // Find the contact name for the waiting-for reference
              const waitingForContact = contact.waitingForContactId
                ? contacts.find((c) => c.id === contact.waitingForContactId)
                : null;

              return (
                <tr key={contact.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 text-[14px] text-neutral-700">
                    {contact.name}
                  </td>
                  <td className="px-4 py-3 text-[14px] text-neutral-500">
                    {contact.jobTitle || <span className="text-neutral-300">--</span>}
                  </td>
                  <td className="px-4 py-3 text-[14px] text-neutral-700">
                    {order ? formatOrdinal(order) : <span className="text-neutral-400">--</span>}
                  </td>
                  <td className="px-4 py-3">
                    <DMUBadge position={contact.dmuPosition} />
                  </td>
                  <td className="px-4 py-3 text-[14px] text-neutral-700">
                    {authorityLabel(contact.authority)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <EngagementStatusSelect
                        value={contact.engagementStatus}
                        onChange={(status) => handleStatusChange(contact, status)}
                        disabled={setEngagement.isPending}
                      />
                      {isStagnating && (
                        <span
                          className="text-[12px] text-orange-700 bg-orange-100 rounded-full px-1.5 py-0 border border-orange-300"
                          title={`${stagnationDays} dagen in huidige fase`}
                        >
                          <span className="sr-only">{stagnationDays} dagen in huidige fase</span>
                          {stagnationDays}d
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {contact.engagementStatus === 'wacht-op-intern' ? (
                      <WaitingForSelect
                        contacts={contacts}
                        currentContactId={contact.id}
                        value={contact.waitingForContactId}
                        onChange={(id) => handleWaitingForChange(contact, id)}
                      />
                    ) : waitingForContact ? (
                      <span className="text-[14px] text-neutral-700">
                        {waitingForContact.name}
                      </span>
                    ) : (
                      <span className="text-[14px] text-neutral-400">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: card view */}
      <div className="md:hidden space-y-3">
        {contacts.map((contact) => {
          const stagnationDays = daysSince(contact.engagementStatusChangedAt);
          const isStagnating = stagnationDays >= STAGNATION_THRESHOLD_DAYS;
          const waitingForContact = contact.waitingForContactId
            ? contacts.find((c) => c.id === contact.waitingForContactId)
            : null;
          const order = contactOrder.get(contact.id);

          return (
            <div key={contact.id} className="bg-white border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[14px] font-semibold text-neutral-900">
                  {contact.name}
                </span>
                <DMUBadge position={contact.dmuPosition} />
                {order && (
                  <span className="text-[12px] text-neutral-500">
                    {formatOrdinal(order)}
                  </span>
                )}
              </div>
              {contact.jobTitle && (
                <p className="text-[13px] text-neutral-500 mb-2">{contact.jobTitle}</p>
              )}
              <div className="space-y-2 text-[14px]">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Bevoegdheid</span>
                  <span className="text-neutral-700">
                    {authorityLabel(contact.authority)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Status</span>
                  <div className="flex items-center gap-1">
                    <EngagementBadge status={contact.engagementStatus} size="sm" />
                    {isStagnating && (
                      <span className="text-[12px] text-orange-700 bg-orange-100 rounded-full px-1.5 py-0 border border-orange-300">
                        {stagnationDays}d
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Wacht op</span>
                  <span className="text-neutral-700">
                    {waitingForContact ? waitingForContact.name : '--'}
                  </span>
                </div>
                <div className="pt-2">
                  <EngagementStatusSelect
                    value={contact.engagementStatus}
                    onChange={(status) => handleStatusChange(contact, status)}
                    disabled={setEngagement.isPending}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drop-off reason dialog */}
      {pendingDropOff && (
        <DropOffReasonDialog
          contactName={pendingDropOff.name}
          onConfirm={handleDropOffConfirm}
          onCancel={() => setPendingDropOff(null)}
        />
      )}
    </div>
  );
}
