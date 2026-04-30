import { useState } from 'react';
import type { Contact, SystemEvent } from '@/db/types';
import { useAddSystemEvent } from '@/hooks/useSystemEvents';

type ManualEventType = Extract<
  SystemEvent['eventType'],
  'blokkade_registered' | 'demo_gegeven' | 'offerte_verstuurd' | 'beslissing_genomen' | 'contract_getekend' | 'implementatie_gestart' | 'evaluatie_gepland'
>;

interface EventTypeOption {
  value: ManualEventType;
  label: string;
  color: string;
  placeholder: string;
}

const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  { value: 'blokkade_registered', label: 'Blokkade / wachtpunt', color: 'bg-red-500', placeholder: 'Bijv. Wacht op budget-goedkeuring' },
  { value: 'demo_gegeven', label: 'Demo / presentatie', color: 'bg-purple-500', placeholder: 'Bijv. Volledige demo gegeven aan MT' },
  { value: 'offerte_verstuurd', label: 'Offerte verstuurd', color: 'bg-blue-500', placeholder: 'Bijv. Pakket A offerte per mail verstuurd' },
  { value: 'beslissing_genomen', label: 'Beslissing genomen', color: 'bg-amber-500', placeholder: 'Bijv. School kiest voor Cito-pakket' },
  { value: 'contract_getekend', label: 'Contract getekend', color: 'bg-green-500', placeholder: 'Bijv. 3-jarig contract ondertekend' },
  { value: 'implementatie_gestart', label: 'Implementatie gestart', color: 'bg-teal-500', placeholder: 'Bijv. Onboarding ingepland voor april' },
  { value: 'evaluatie_gepland', label: 'Evaluatiegesprek', color: 'bg-indigo-500', placeholder: 'Bijv. Evaluatie na eerste toetsronde' },
];

interface EventRegistrationFormProps {
  schoolId: string;
  contacts: Contact[];
  onSaved: () => void;
  onCancel: () => void;
}

export default function EventRegistrationForm({ schoolId, contacts, onSaved, onCancel }: EventRegistrationFormProps) {
  const [selectedType, setSelectedType] = useState<ManualEventType | null>(null);
  const [description, setDescription] = useState('');
  const [relatedContactId, setRelatedContactId] = useState('');
  const [outcome, setOutcome] = useState<'positief' | 'negatief'>('positief');
  const addEvent = useAddSystemEvent();

  const selectedOption = EVENT_TYPE_OPTIONS.find(o => o.value === selectedType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !description.trim()) return;

    const relatedContact = relatedContactId
      ? contacts.find(c => c.id === relatedContactId)
      : null;

    const metadata: Record<string, string> = {
      ...(relatedContact ? { contactId: relatedContact.id, contactName: relatedContact.name } : {}),
    };

    if (selectedType === 'blokkade_registered') {
      metadata.resolved = 'false';
    }
    if (selectedType === 'beslissing_genomen') {
      metadata.outcome = outcome;
    }

    await addEvent.mutateAsync({
      schoolId,
      event: {
        eventType: selectedType,
        description: description.trim(),
        metadata,
      },
    });

    setSelectedType(null);
    setDescription('');
    setRelatedContactId('');
    setOutcome('positief');
    onSaved();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mt-4"
    >
      {/* Event type selector */}
      <div className="mb-3">
        <label className="block text-[14px] font-semibold text-neutral-700 mb-2">
          Type gebeurtenis
        </label>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPE_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedType(option.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                selectedType === option.value
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${option.color}`} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {selectedType && (
        <>
          {/* Description */}
          <div className="mb-3">
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Beschrijving
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-[14px] text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary resize-y"
              placeholder={selectedOption?.placeholder}
              aria-label="Gebeurtenis beschrijving"
            />
          </div>

          {/* Contact dropdown */}
          <div className="mb-3">
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

          {/* Outcome toggle for beslissing */}
          {selectedType === 'beslissing_genomen' && (
            <div className="mb-4">
              <label className="block text-[14px] font-semibold text-neutral-700 mb-2">
                Uitkomst
              </label>
              <div className="inline-flex rounded-lg border border-neutral-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOutcome('positief')}
                  className={`px-4 py-2 text-[13px] font-semibold transition-colors ${
                    outcome === 'positief'
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Positief
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome('negatief')}
                  className={`px-4 py-2 text-[13px] font-semibold transition-colors ${
                    outcome === 'negatief'
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Negatief
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={!description.trim() || addEvent.isPending}
              className="h-[44px] px-4 bg-cito-accent text-white rounded-lg text-[14px] font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {addEvent.isPending ? 'Opslaan...' : 'Opslaan'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-[14px] text-neutral-500 hover:text-neutral-700"
            >
              Annuleren
            </button>
          </div>
        </>
      )}

      {!selectedType && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="text-[14px] text-neutral-500 hover:text-neutral-700"
          >
            Annuleren
          </button>
        </div>
      )}
    </form>
  );
}
