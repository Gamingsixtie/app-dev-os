import type { Contact } from '@/db/types';
import { DMU_POSITION_LABELS } from '@/models/school';

interface WaitingForSelectProps {
  contacts: Contact[];
  currentContactId: string;
  value: string | null;
  onChange: (contactId: string | null) => void;
}

export default function WaitingForSelect({
  contacts,
  currentContactId,
  value,
  onChange,
}: WaitingForSelectProps) {
  // Show all other contacts in the school (excluding self)
  const otherContacts = contacts.filter((c) => c.id !== currentContactId);

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-9 px-2 border border-neutral-200 rounded text-[14px] text-neutral-700 bg-white focus:outline-2 focus:outline-cito-primary focus:outline-offset-2"
      aria-label="Selecteer contact waar op gewacht wordt"
    >
      <option value="">--</option>
      {otherContacts.map((contact) => (
        <option key={contact.id} value={contact.id}>
          {contact.name} ({DMU_POSITION_LABELS[contact.dmuPosition]})
        </option>
      ))}
    </select>
  );
}
