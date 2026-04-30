import { useState } from 'react';
import type { Contact } from '@/db/types';
import DMUBadge from '@/components/ui/DMUBadge';

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  canDelete: boolean;
  linkedConversations: number;
}

export default function ContactCard({
  contact,
  onEdit,
  onDelete,
  canDelete,
  linkedConversations,
}: ContactCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const initials = contact.name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const authorityLabel =
    contact.authority.charAt(0).toUpperCase() + contact.authority.slice(1);

  const formattedDate = contact.lastContactDate
    ? new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(contact.lastContactDate))
    : '--';

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6">
      <div className="flex items-start gap-4">
        {/* Initials circle */}
        <div className="flex-shrink-0 w-[40px] h-[40px] rounded-full bg-cito-primary flex items-center justify-center">
          <span className="text-white text-[16px] font-semibold">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + Primary badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[16px] font-semibold text-neutral-900">
              {contact.name}
            </span>
            {contact.isPrimary && (
              <span className="bg-cito-primary text-white text-[14px] rounded-full px-2 py-0.5">
                Primair
              </span>
            )}
          </div>

          {/* Job title */}
          {contact.jobTitle && (
            <p className="text-[14px] text-neutral-500 mt-0.5">{contact.jobTitle}</p>
          )}

          {/* DMU + Authority */}
          <div className="flex items-center gap-2 mt-1">
            <DMUBadge position={contact.dmuPosition} />
            <span className="text-[14px] text-neutral-500">{authorityLabel}</span>
          </div>

          {/* Email + Phone */}
          <div className="flex items-center gap-4 mt-2 text-[14px] text-neutral-500">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>{contact.phone}</span>}
          </div>

          {/* Last contact date */}
          <p className="text-[14px] text-neutral-400 mt-1">
            Laatst contact: {formattedDate}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 mt-4">
        <button
          type="button"
          onClick={() => onEdit(contact)}
          className="text-[14px] text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          Bewerken
        </button>
        {canDelete ? (
          <>
            {showConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-[14px] text-neutral-500">Verwijderen?</span>
                <button
                  type="button"
                  onClick={() => onDelete(contact)}
                  className="text-[14px] text-red-600 hover:text-red-700 font-semibold transition-colors"
                >
                  Ja
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="text-[14px] text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  Nee
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="text-[14px] text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                Verwijderen
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            disabled
            title={`Ontkoppel eerst de ${linkedConversations} gekoppelde gesprek(ken)`}
            className="text-[14px] text-neutral-500 opacity-50 cursor-not-allowed"
          >
            Verwijderen
          </button>
        )}
      </div>
    </div>
  );
}
