import { useMemo } from 'react';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import { calculateComparison, getTotalStudents } from '@/engine/price-comparison';
import { detectSchijnvoordelen, type SchijnvoordeelWarning } from '@/engine/schijnvoordeel';
import { calculateUpsell, type UpsellOpportunity } from '@/engine/upsell';

export function useWizardInsights() {
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);

  const totalStudents = getTotalStudents(studentCounts);

  const comparisonPreview = useMemo(
    () => calculateComparison(selectedModules, studentCounts),
    [selectedModules, studentCounts],
  );

  const schijnvoordelen: SchijnvoordeelWarning[] = useMemo(
    () => detectSchijnvoordelen(selectedModules, studentCounts, comparisonPreview, moduleSetups),
    [selectedModules, studentCounts, comparisonPreview, moduleSetups],
  );

  const upsellOpportunities: UpsellOpportunity[] = useMemo(
    () => calculateUpsell(moduleSetups, comparisonPreview),
    [moduleSetups, comparisonPreview],
  );

  return {
    comparisonPreview,
    schijnvoordelen,
    upsellOpportunities,
    totalStudents,
  };
}
