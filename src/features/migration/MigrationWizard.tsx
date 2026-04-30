import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { extractV1Data, migrateV1ToSchool, clearV1Data } from '@/db/migrations';

interface MigrationWizardProps {
  onDismiss: () => void;
}

export default function MigrationWizard({ onDismiss }: MigrationWizardProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const v1Result = extractV1Data();
  const [name, setName] = useState(v1Result.suggestedName ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const school = await migrateV1ToSchool(name.trim());
    clearV1Data();
    navigate({
      to: '/scholen/$slug/wizard/$step',
      params: { slug: school.slug, step: '1' },
    });
  };

  const handleSkip = () => {
    clearV1Data();
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div role="dialog" aria-modal="true" className="relative bg-white rounded-lg p-8 max-w-[480px] w-full mx-4 shadow-xl">
        {v1Result.success ? (
          <>
            <h2 className="text-[20px] font-semibold text-neutral-900 mb-4">
              Welkom bij de nieuwe versie
            </h2>
            <p className="text-base text-neutral-600 mb-4">
              We hebben uw eerdere gegevens gevonden. Geef dit schoolprofiel een naam zodat u het later gemakkelijk terugvindt.
            </p>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-[44px] px-4 text-base border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cito-primary/20 focus:border-cito-primary mb-1"
            />
            <p className="text-[14px] text-neutral-500 mb-6">
              Suggestie op basis van uw eerdere invoer
            </p>
            <div className="flex justify-end gap-4">
              <button type="button" onClick={handleSkip} className="h-[44px] px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg">
                Annuleren
              </button>
              <button type="button" onClick={handleSave} disabled={saving || !name.trim()} className="h-[44px] px-4 text-sm font-semibold bg-cito-accent text-white rounded-lg hover:bg-[#E55B00] disabled:opacity-50">
                {saving ? 'Opslaan...' : 'Profiel opslaan'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-[20px] font-semibold text-neutral-900 mb-4">
              Gegevens niet leesbaar
            </h2>
            <p className="text-base text-neutral-600 mb-6">
              Uw eerdere gegevens konden niet worden overgezet. U kunt opnieuw beginnen met een nieuw schoolprofiel.
            </p>
            <div className="flex justify-end">
              <button type="button" onClick={handleSkip} className="h-[44px] px-4 text-sm font-semibold bg-cito-accent text-white rounded-lg hover:bg-[#E55B00]">
                Opnieuw beginnen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
