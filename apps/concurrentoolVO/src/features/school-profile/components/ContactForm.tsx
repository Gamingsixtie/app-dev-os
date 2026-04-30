import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { contactSchema } from '@/features/school-profile/schemas/contact.schema';
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import type { Contact } from '@/db/types';
import { DMU_POSITIONS, DMU_POSITION_LABELS, PREFERRED_CHANNELS, AUTHORITY_LEVELS } from '@/models/school';

type ContactFormInput = z.input<typeof contactSchema>;

interface ContactFormProps {
  contact?: Contact;
  schoolId: string;
  onClose: () => void;
  onSaved: () => void;
}

const PREFERRED_CHANNEL_LABELS: Record<string, string> = {
  email: 'E-mail',
  telefoon: 'Telefoon',
  teams: 'Teams',
  overig: 'Overig',
};

const AUTHORITY_LABELS: Record<string, string> = {
  adviserend: 'Adviserend',
  beslissend: 'Beslissend',
  budgethouder: 'Budgethouder',
};

export default function ContactForm({ contact, schoolId, onClose, onSaved }: ContactFormProps) {
  const isEditing = !!contact;
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact
      ? {
          name: contact.name,
          dmuPosition: contact.dmuPosition,
          jobTitle: contact.jobTitle,
          email: contact.email,
          phone: contact.phone,
          preferredChannel: contact.preferredChannel,
          authority: contact.authority,
          notes: contact.notes,
          isPrimary: contact.isPrimary,
        }
      : {
          name: '',
          dmuPosition: 'gebruiker',
          jobTitle: '',
          email: '',
          phone: '',
          preferredChannel: 'email',
          authority: 'adviserend',
          notes: '',
          isPrimary: false,
        },
  });

  const onSubmit = async (data: ContactFormInput) => {
    setSaveError(null);
    try {
      if (isEditing && contact) {
        await updateContact.mutateAsync({ schoolId, contactId: contact.id, data });
      } else {
        await createContact.mutateAsync({ schoolId, data });
      }
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Onbekende fout';
      console.error('Contact opslaan mislukt:', err);
      setSaveError(`Opslaan mislukt: ${message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white w-full sm:w-[400px] h-full overflow-y-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-semibold text-neutral-900">
            {isEditing ? 'Contact bewerken' : 'Contact toevoegen'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-[44px] h-[44px] flex items-center justify-center text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Naam */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Naam <span className="text-red-600">*</span>
            </label>
            <input
              {...register('name')}
              type="text"
              className="h-[44px] w-full border border-neutral-200 rounded-lg px-3 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary"
            />
            {errors.name && (
              <p className="text-[14px] text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* DMU-positie */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              DMU-positie <span className="text-red-600">*</span>
            </label>
            <select
              {...register('dmuPosition')}
              className="h-[44px] w-full border border-neutral-200 rounded-lg px-3 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary bg-white"
            >
              {DMU_POSITIONS.map(pos => (
                <option key={pos} value={pos}>
                  {DMU_POSITION_LABELS[pos]}
                </option>
              ))}
            </select>
            {errors.dmuPosition && (
              <p className="text-[14px] text-red-600 mt-1">{errors.dmuPosition.message}</p>
            )}
          </div>

          {/* Functietitel */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Functietitel
            </label>
            <input
              {...register('jobTitle')}
              type="text"
              className="h-[44px] w-full border border-neutral-200 rounded-lg px-3 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary"
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              E-mail
            </label>
            <input
              {...register('email')}
              type="text"
              className="h-[44px] w-full border border-neutral-200 rounded-lg px-3 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary"
            />
            {errors.email && (
              <p className="text-[14px] text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Telefoon */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Telefoon
            </label>
            <input
              {...register('phone')}
              type="text"
              className="h-[44px] w-full border border-neutral-200 rounded-lg px-3 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary"
            />
          </div>

          {/* Voorkeur communicatie */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Voorkeur communicatie
            </label>
            <select
              {...register('preferredChannel')}
              className="h-[44px] w-full border border-neutral-200 rounded-lg px-3 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary bg-white"
            >
              {PREFERRED_CHANNELS.map(ch => (
                <option key={ch} value={ch}>
                  {PREFERRED_CHANNEL_LABELS[ch]}
                </option>
              ))}
            </select>
          </div>

          {/* Beslissingsbevoegdheid */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Beslissingsbevoegdheid
            </label>
            <select
              {...register('authority')}
              className="h-[44px] w-full border border-neutral-200 rounded-lg px-3 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary bg-white"
            >
              {AUTHORITY_LEVELS.map(a => (
                <option key={a} value={a}>
                  {AUTHORITY_LABELS[a]}
                </option>
              ))}
            </select>
          </div>

          {/* Notities */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Notities
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary resize-y"
            />
          </div>

          {/* Primair contactpersoon */}
          <div className="flex items-center gap-2">
            <input
              {...register('isPrimary')}
              type="checkbox"
              className="w-[20px] h-[20px] rounded border-neutral-300 text-cito-primary focus:ring-cito-primary"
            />
            <label className="text-[14px] text-neutral-700">
              Primair contactpersoon
            </label>
          </div>

          {/* Error message */}
          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[14px] text-red-700">
              {saveError}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="h-[44px] px-4 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[44px] px-6 text-[14px] font-semibold bg-cito-accent text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Opslaan...' : 'Contact opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
