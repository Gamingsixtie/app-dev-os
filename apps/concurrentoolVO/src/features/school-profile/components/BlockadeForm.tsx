import { useState } from 'react';
import type { Contact } from '@/db/types';
import { useAddSystemEvent } from '@/hooks/useSystemEvents';

interface BlockadeFormProps {
  schoolId: string;
  contacts: Contact[];
  onSaved: () => void;
  onCancel: () => void;
}

export default function BlockadeForm({ schoolId, contacts, onSaved, onCancel }: BlockadeFormProps) {
  const [description, setDescription] = useState('');
  const [relatedContactId, setRelatedContactId] = useState('');
  const addEvent = useAddSystemEvent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const relatedContact = relatedContactId
      ? contacts.find(c => c.id === relatedContactId)
      : null;

    await addEvent.mutateAsync({
      schoolId,
      event: {
        eventType: 'blokkade_registered',
        description: description.trim(),
        metadata: {
          ...(relatedContact ? { contactId: relatedContact.id, contactName: relatedContact.name } : {}),
          resolved: 'false',
        },
      },
    });

    setDescription('');
    setRelatedContactId('');
    onSaved();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mt-4"
    >
      <div className="mb-3">
        <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
          Blokkade of wachtpunt
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-[14px] text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary resize-y"
          placeholder="Bijv. Wacht op budget-goedkeuring van [contactpersoon]"
          aria-label="Blokkade beschrijving"
        />
      </div>

      <div className="mb-4">
        <label className="block text-[14px] text-neutral-700 mb-1">
          Gerelateerd aan
        </label>
        <select
          value={relatedContactId}
          onChange={e => setRelatedContactId(e.target.value)}
          className="h-[44px] w-full border border-neutral-200 rounded-lg px-3 text-[14px] text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary bg-white"
        >
          <option value="">Geen contactpersoon</option>
          {contacts.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={!description.trim() || addEvent.isPending}
          className="h-[44px] px-4 bg-cito-accent text-white rounded-lg text-[14px] font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {addEvent.isPending ? 'Opslaan...' : 'Blokkade opslaan'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[14px] text-neutral-500 hover:text-neutral-700"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}
