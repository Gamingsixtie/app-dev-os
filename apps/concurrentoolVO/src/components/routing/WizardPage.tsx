import { useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import { useSchool } from '@/hooks/useSchools';
import WizardShell from '@/components/wizard/WizardShell';

export default function WizardPage() {
  const { slug, step } = useParams({ from: '/scholen/$slug/wizard/$step' });
  const setCurrentStep = useSchoolProfileStore((s) => s.setCurrentStep);

  // Check if school is fresh (no completed steps) for context-aware header
  const { data: schoolRecord } = useSchool(slug);
  const isFreshSchool = (schoolRecord?.completedSteps?.length ?? 0) === 0;

  // Sync URL step param (1-based) to store step (0-based)
  useEffect(() => {
    const stepIndex = Math.max(0, Math.min(4, parseInt(step, 10) - 1));
    setCurrentStep(stepIndex);
  }, [step, setCurrentStep]);

  return (
    <main className="mx-auto max-w-[720px] py-12 px-4 sm:px-8">
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 bg-cito-primary text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Cito intern instrument
        </span>
        <h1 className="text-[28px] font-semibold leading-[1.2] text-cito-primary">
          {isFreshSchool ? 'Schoolprofiel instellen' : 'Prijsvergelijking voor uw school'}
        </h1>
        <p className="mt-2 text-base text-neutral-600 max-w-[560px]">
          {isFreshSchool
            ? 'Vul de basisgegevens van de school in om een prijsvergelijking te kunnen maken.'
            : 'Vul het schoolprofiel in en vergelijk de kosten van Cito, DIA en JIJ (IEP) per module.'}
        </p>
      </div>

      <WizardShell />
    </main>
  );
}
