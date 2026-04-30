import type { IntakeExtractionV2 } from '@/features/school-profile/schemas/intake-extraction.schema';
import type { SchoolRecord, Contact } from '@/db/types';
import type { DiffStatus } from '@/features/school-profile/components/DiffViewItem';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DiffItem {
  id: string;
  label: string;
  newValue: string;
  existingValue?: string;
  status: DiffStatus;
  checked: boolean;
  editable: boolean;
}

export interface DiffSection {
  title: string;
  items: DiffItem[];
}

// ─── Diff computation ────────────────────────────────────────────────────────

/**
 * Compute diff items for modules extracted vs existing school moduleSetups.
 */
export function computeModuleDiff(
  extraction: IntakeExtractionV2,
  existingSchool: SchoolRecord,
): DiffItem[] {
  return extraction.moduleSetups.map((ms, i) => {
    const existing = existingSchool.moduleSetups.find(
      e => e.moduleId === ms.moduleId,
    );
    const providerLabel = ms.currentProvider;
    const newVal = ms.customProviderName
      ? `${ms.moduleId} - ${ms.customProviderName}`
      : `${ms.moduleId} - ${providerLabel}`;

    if (existing) {
      const existingVal = existing.customProviderName
        ? `${existing.moduleId} - ${existing.customProviderName}`
        : `${existing.moduleId} - ${existing.currentProvider}`;

      const isSame =
        existing.currentProvider === ms.currentProvider &&
        existing.customProviderName === ms.customProviderName;

      return {
        id: `module-${i}`,
        label: ms.moduleId,
        newValue: newVal,
        existingValue: existingVal,
        status: isSame ? ('existing' as const) : ('conflict' as const),
        checked: !isSame ? false : false,
        editable: !isSame,
      };
    }

    return {
      id: `module-${i}`,
      label: ms.moduleId,
      newValue: newVal,
      status: 'new' as const,
      checked: true,
      editable: true,
    };
  });
}

/**
 * Compute diff items for prices from moduleSetups.
 */
export function computePriceDiff(
  extraction: IntakeExtractionV2,
  existingSchool: SchoolRecord,
): DiffItem[] {
  return extraction.moduleSetups
    .filter(ms => ms.pricePerStudent !== null)
    .map((ms, i) => {
      const existing = existingSchool.moduleSetups.find(
        e => e.moduleId === ms.moduleId,
      );
      const priceStr = `\u20AC${ms.pricePerStudent!.toFixed(2)}/leerling`;

      if (existing?.pricePerStudent !== null && existing?.pricePerStudent !== undefined) {
        const existingStr = `\u20AC${existing.pricePerStudent.toFixed(2)}/leerling`;
        const isSame = existing.pricePerStudent === ms.pricePerStudent;
        return {
          id: `price-${i}`,
          label: `${ms.moduleId} - prijs`,
          newValue: priceStr,
          existingValue: existingStr,
          status: isSame ? ('existing' as const) : ('conflict' as const),
          checked: !isSame ? false : false,
          editable: !isSame,
        };
      }

      return {
        id: `price-${i}`,
        label: `${ms.moduleId} - prijs`,
        newValue: priceStr,
        status: 'new' as const,
        checked: true,
        editable: true,
      };
    });
}

/**
 * Fuzzy match contact by name (case-insensitive, trimmed).
 */
function findMatchingContact(naam: string, existing: Contact[]): Contact | undefined {
  const normalized = naam.trim().toLowerCase();
  return existing.find(c => c.name.trim().toLowerCase() === normalized);
}

/**
 * Compute diff items for contacts extracted vs existing.
 */
export function computeContactDiff(
  extraction: IntakeExtractionV2,
  existingContacts: Contact[],
): DiffItem[] {
  return extraction.contactPersonen.map((cp, i) => {
    const match = findMatchingContact(cp.naam, existingContacts);
    const newVal = [cp.naam, cp.rol, cp.email, cp.telefoon].filter(Boolean).join(', ');

    if (match) {
      const existingVal = [match.name, match.jobTitle, match.email, match.phone]
        .filter(Boolean)
        .join(', ');
      return {
        id: `contact-${i}`,
        label: cp.naam,
        newValue: newVal,
        existingValue: existingVal,
        status: 'conflict' as const,
        checked: false,
        editable: true,
      };
    }

    return {
      id: `contact-${i}`,
      label: cp.naam,
      newValue: newVal,
      status: 'new' as const,
      checked: true,
      editable: true,
    };
  });
}

/**
 * Compute diff items for action items (always new).
 */
export function computeActionDiff(
  extraction: IntakeExtractionV2,
): DiffItem[] {
  return extraction.actiePunten.map((ap, i) => ({
    id: `action-${i}`,
    label: ap.wat,
    newValue: [ap.wat, ap.wanneer, ap.verantwoordelijke].filter(Boolean).join(' - '),
    status: 'new' as const,
    checked: true,
    editable: true,
  }));
}
