import { useState, useCallback } from 'react';
import type { IntakeExtractionV2 } from '@/features/school-profile/schemas/intake-extraction.schema';
import type { SchoolRecord, Contact, ActionItem } from '@/db/types';
import { PriceDeviationWarning } from '@/components/ui/PriceDeviationWarning';
import DiffViewSection from './DiffViewSection';
import DiffViewItem from './DiffViewItem';
import {
  computeModuleDiff,
  computePriceDiff,
  computeContactDiff,
  computeActionDiff,
  type DiffItem,
} from '@/features/school-profile/utils/diff-view';

// ─── DiffSelection type ─────────────────────────────────────────────────────

export type DiffSelection = {
  modules: { moduleId: string; provider: string; pricePerStudent: number | null }[];
  contacts: { naam: string; rol?: string; dmuPositie?: string; email?: string; telefoon?: string }[];
  actions: { wat: string; wanneer?: string; verantwoordelijke?: string }[];
  pipelineSignaal?: string;
  levels: string[];
  studentCountsPerLevel: Record<string, number> | null;
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface DiffViewProps {
  extraction: IntakeExtractionV2;
  existingSchool: SchoolRecord;
  existingContacts: Contact[];
  existingActions: ActionItem[];
  onConfirm: (selectedItems: DiffSelection) => void;
  onCancel: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Diff-view confirmation screen showing extracted data vs existing school data.
 * Per D-03 (diff-view confirmation), D-05 (append only), D-12 (publication prices visible).
 */
export default function DiffView({
  extraction,
  existingSchool,
  existingContacts,
  existingActions: _existingActions,
  onConfirm,
  onCancel,
}: DiffViewProps) {
  // Mutable copy of extraction data for editable fields
  const [editableExtraction, setEditableExtraction] = useState(() => ({
    ...extraction,
    moduleSetups: extraction.moduleSetups.map(ms => ({ ...ms })),
    contactPersonen: extraction.contactPersonen.map(cp => ({ ...cp })),
    actiePunten: extraction.actiePunten.map(ap => ({ ...ap })),
  }));

  // Compute diff items
  const [moduleItems, setModuleItems] = useState<DiffItem[]>(() =>
    computeModuleDiff(editableExtraction, existingSchool),
  );
  const [priceItems, setPriceItems] = useState<DiffItem[]>(() =>
    computePriceDiff(editableExtraction, existingSchool),
  );
  const [contactItems, setContactItems] = useState<DiffItem[]>(() =>
    computeContactDiff(editableExtraction, existingContacts),
  );
  const [actionItems, setActionItems] = useState<DiffItem[]>(() =>
    computeActionDiff(editableExtraction),
  );
  const [pipelineChecked, setPipelineChecked] = useState(!!extraction.pipelineSignaal);

  // Generic item updater
  const updateItem = useCallback(
    (
      setter: React.Dispatch<React.SetStateAction<DiffItem[]>>,
      id: string,
      update: Partial<DiffItem>,
    ) => {
      setter(prev => prev.map(item => (item.id === id ? { ...item, ...update } : item)));
    },
    [],
  );

  // Build DiffSelection from checked items using mutable extraction state
  const handleConfirm = () => {
    const selectedModules = moduleItems
      .filter(item => item.checked)
      .map((_, i) => {
        const ms = editableExtraction.moduleSetups[i];
        return {
          moduleId: ms.moduleId,
          provider: ms.customProviderName || ms.currentProvider,
          pricePerStudent: ms.pricePerStudent,
        };
      });

    const selectedContacts = contactItems
      .filter(item => item.checked)
      .map((_, i) => {
        const cp = editableExtraction.contactPersonen[i];
        return {
          naam: cp.naam,
          rol: cp.rol,
          dmuPositie: cp.dmuPositie,
          email: cp.email,
          telefoon: cp.telefoon,
        };
      });

    const selectedActions = actionItems
      .filter(item => item.checked)
      .map((_, i) => {
        const ap = editableExtraction.actiePunten[i];
        return {
          wat: ap.wat,
          wanneer: ap.wanneer,
          verantwoordelijke: ap.verantwoordelijke,
        };
      });

    const selection: DiffSelection = {
      modules: selectedModules,
      contacts: selectedContacts,
      actions: selectedActions,
      pipelineSignaal: pipelineChecked ? editableExtraction.pipelineSignaal : undefined,
      levels: editableExtraction.levels,
      studentCountsPerLevel: editableExtraction.studentCountsPerLevel,
    };

    onConfirm(selection);
  };

  // Handle value edits - update both DiffItem display and mutable extraction
  const handleModuleValueChange = (itemId: string, value: string) => {
    updateItem(setModuleItems, itemId, { newValue: value });
  };

  const handlePriceValueChange = (itemId: string, value: string) => {
    updateItem(setPriceItems, itemId, { newValue: value });
    // Parse price back into extraction
    const idx = priceItems.findIndex(p => p.id === itemId);
    if (idx >= 0) {
      const priceMatch = value.match(/[\d.,]+/);
      if (priceMatch) {
        const newPrice = parseFloat(priceMatch[0].replace(',', '.'));
        if (!isNaN(newPrice)) {
          setEditableExtraction(prev => {
            const msIdx = prev.moduleSetups.findIndex(
              ms => ms.pricePerStudent !== null && ms.moduleId === priceItems[idx].label.replace(' - prijs', ''),
            );
            if (msIdx >= 0) {
              const updated = { ...prev };
              updated.moduleSetups = [...updated.moduleSetups];
              updated.moduleSetups[msIdx] = { ...updated.moduleSetups[msIdx], pricePerStudent: newPrice };
              return updated;
            }
            return prev;
          });
        }
      }
    }
  };

  const handleContactValueChange = (itemId: string, value: string) => {
    updateItem(setContactItems, itemId, { newValue: value });
    const idx = contactItems.findIndex(c => c.id === itemId);
    if (idx >= 0) {
      // Parse "naam, rol, email, telefoon" back
      const parts = value.split(',').map(s => s.trim());
      setEditableExtraction(prev => {
        const updated = { ...prev };
        updated.contactPersonen = [...updated.contactPersonen];
        updated.contactPersonen[idx] = {
          ...updated.contactPersonen[idx],
          naam: parts[0] || updated.contactPersonen[idx].naam,
        };
        return updated;
      });
    }
  };

  const handleActionValueChange = (itemId: string, value: string) => {
    updateItem(setActionItems, itemId, { newValue: value });
    const idx = actionItems.findIndex(a => a.id === itemId);
    if (idx >= 0) {
      const parts = value.split(' - ').map(s => s.trim());
      setEditableExtraction(prev => {
        const updated = { ...prev };
        updated.actiePunten = [...updated.actiePunten];
        updated.actiePunten[idx] = {
          ...updated.actiePunten[idx],
          wat: parts[0] || updated.actiePunten[idx].wat,
          wanneer: parts[1] || updated.actiePunten[idx].wanneer,
          verantwoordelijke: parts[2] || updated.actiePunten[idx].verantwoordelijke,
        };
        return updated;
      });
    }
  };

  const PIPELINE_LABELS: Record<string, string> = {
    interesse: 'Interesse',
    twijfel: 'Twijfel',
    afwijzing: 'Afwijzing',
    'concurrent-switch': 'Concurrent-switch',
    verlenging: 'Verlenging',
    neutraal: 'Neutraal',
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6">
      {/* Heading */}
      <h2 className="text-[20px] font-semibold text-neutral-900 mb-1">
        Herkende gegevens
      </h2>
      <p className="text-[14px] text-neutral-500 mb-6">
        Vink aan wat u wilt overnemen. U kunt waarden aanpassen voor opslaan. Bestaande gegevens blijven bewaard.
      </p>

      {/* Sections */}
      {moduleItems.length > 0 && (
        <DiffViewSection title="Modules & aanbieders">
          {moduleItems.map(item => (
            <DiffViewItem
              key={item.id}
              label={item.label}
              newValue={item.newValue}
              existingValue={item.existingValue}
              status={item.status}
              checked={item.checked}
              onChange={checked => updateItem(setModuleItems, item.id, { checked })}
              editable={item.editable}
              onValueChange={value => handleModuleValueChange(item.id, value)}
            />
          ))}
        </DiffViewSection>
      )}

      {priceItems.length > 0 && (
        <DiffViewSection title="Prijzen">
          {priceItems.map(item => {
            const moduleId = item.label.replace(' - prijs', '');
            const ms = editableExtraction.moduleSetups.find(m => m.moduleId === moduleId);
            return (
              <div key={item.id}>
                <DiffViewItem
                  label={item.label}
                  newValue={item.newValue}
                  existingValue={item.existingValue}
                  status={item.status}
                  checked={item.checked}
                  onChange={checked => updateItem(setPriceItems, item.id, { checked })}
                  editable={item.editable}
                  onValueChange={value => handlePriceValueChange(item.id, value)}
                />
                {ms && ms.pricePerStudent !== null && (
                  <div className="ml-8 mb-1">
                    <PriceDeviationWarning
                      moduleId={ms.moduleId}
                      provider={ms.currentProvider}
                      amount={ms.pricePerStudent}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </DiffViewSection>
      )}

      {contactItems.length > 0 && (
        <DiffViewSection title="Contactpersonen">
          {contactItems.map(item => (
            <DiffViewItem
              key={item.id}
              label={item.label}
              newValue={item.newValue}
              existingValue={item.existingValue}
              status={item.status}
              checked={item.checked}
              onChange={checked => updateItem(setContactItems, item.id, { checked })}
              editable={item.editable}
              onValueChange={value => handleContactValueChange(item.id, value)}
            />
          ))}
        </DiffViewSection>
      )}

      {actionItems.length > 0 && (
        <DiffViewSection title="Actiepunten">
          {actionItems.map(item => (
            <DiffViewItem
              key={item.id}
              label={item.label}
              newValue={item.newValue}
              status={item.status}
              checked={item.checked}
              onChange={checked => updateItem(setActionItems, item.id, { checked })}
              editable={item.editable}
              onValueChange={value => handleActionValueChange(item.id, value)}
            />
          ))}
        </DiffViewSection>
      )}

      {extraction.pipelineSignaal && (
        <DiffViewSection title="Pipelinesignaal">
          <DiffViewItem
            label="Signaal"
            newValue={PIPELINE_LABELS[extraction.pipelineSignaal] ?? extraction.pipelineSignaal}
            status="new"
            checked={pipelineChecked}
            onChange={setPipelineChecked}
            editable={false}
          />
        </DiffViewSection>
      )}

      {extraction.unsureAbout.length > 0 && (
        <DiffViewSection title="Controleer deze punten">
          <div className="flex flex-col gap-1">
            {extraction.unsureAbout.map((point, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-neutral-700">{point}</span>
              </div>
            ))}
          </div>
        </DiffViewSection>
      )}

      {/* CTA bar */}
      <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={onCancel}
          className="h-[44px] px-4 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          Analyse annuleren
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="h-[44px] px-6 text-[14px] font-semibold bg-cito-accent text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Overnemen en opslaan
        </button>
      </div>
    </div>
  );
}
