import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSchoolProfileStore } from '../store';
import {
  useSchoolplanAnalysis,
  useUpdateAnnotation,
  useDeleteSchoolplanAnalysis,
} from '@/hooks/useSchoolplanAnalysis';
import { uploadAndAnalyzeSchoolplan } from '@/lib/schoolplan-analyzer';
import DocumentDropzone from '../components/DocumentDropzone';
import SchoolplanUpload from '../components/SchoolplanUpload';
import SchoolplanSummary from '../components/SchoolplanSummary';
import KansCardList from '../components/KansCardList';
import SchoolplanStreamingProgress from '../components/SchoolplanStreamingProgress';
import type { OpportunityAnnotation } from '../schemas/schoolplan-analysis.schema';
import { useAuth } from '@/features/auth/AuthProvider';

export default function SchoolplanTab() {
  const schoolId = useSchoolProfileStore((s) => s.activeSchoolId) ?? '';
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  // Analysis data from DB
  const { data: analysis, isLoading: analysisLoading } = useSchoolplanAnalysis(schoolId);
  const updateAnnotation = useUpdateAnnotation(schoolId);
  const deleteAnalysis = useDeleteSchoolplanAnalysis(schoolId);

  // Local state
  const [streamingStep, setStreamingStep] = useState(0); // 0=idle, 1=step1, 2=step2, 3=complete
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleUpload = useCallback(
    async (file: File) => {
      if (!schoolId) return;
      setIsUploading(true);
      setUploadError(null);
      setStreamingStep(1);

      try {
        await uploadAndAnalyzeSchoolplan(schoolId, userProfile?.teamId ?? '', file, (step) => {
          setStreamingStep(step);
        });
        setStreamingStep(3);
        // Invalidate query so React Query refetches the updated DB row
        await queryClient.invalidateQueries({ queryKey: ['schoolplan-analysis', schoolId] });
        // After a brief completion display, reset to show results from DB
        setTimeout(() => {
          setStreamingStep(0);
        }, 1000);
      } catch (err) {
        console.error('Schoolplan upload/analysis error:', err);
        setUploadError(err instanceof Error ? err.message : 'Onbekende fout');
        setStreamingStep(0);
        // Also invalidate so we pick up any DB status changes (e.g. failed status)
        await queryClient.invalidateQueries({ queryKey: ['schoolplan-analysis', schoolId] });
      } finally {
        setIsUploading(false);
      }
    },
    [schoolId],
  );

  const handleReplace = useCallback(() => {
    setShowReplaceConfirm(true);
  }, []);

  const handleConfirmReplace = useCallback(async () => {
    if (!analysis) return;
    try {
      await deleteAnalysis.mutateAsync(analysis.file_path);
    } catch {
      // Deletion error — silently handle, query will refetch
    }
    setShowReplaceConfirm(false);
    setStreamingStep(0);
    setIsUploading(false);
    setUploadError(null);
  }, [analysis, deleteAnalysis]);

  const handleAnnotationChange = useCallback(
    (index: number, annotation: OpportunityAnnotation) => {
      updateAnnotation.mutate({ opportunityIndex: index, annotation });
    },
    [updateAnnotation],
  );

  // ─── Loading / guard ─────────────────────────────────────────────────────

  if (!schoolId) return null; // SchoolLayout handles redirect

  if (analysisLoading) {
    return (
      <div className="p-8 max-sm:p-4">
        <p className="text-sm text-neutral-400">Laden...</p>
      </div>
    );
  }

  // ─── Determine visual state ───────────────────────────────────────────────

  const isAnalyzing = streamingStep > 0 && streamingStep < 3;
  const isCompleteStreaming = streamingStep === 3;
  const hasAnalysis = analysis !== null && analysis !== undefined;
  const isComplete = hasAnalysis && analysis.analysis_status === 'complete';
  const isFailed = hasAnalysis && analysis.analysis_status === 'failed';
  const isPending = hasAnalysis && analysis.analysis_status === 'pending';
  const isSchoolplan =
    isComplete && (analysis.summary !== '' || analysis.opportunities.length > 0);

  return (
    <div className="p-8 max-sm:p-4 space-y-6">
      {/* ── State B: Analyzing ─────────────────────────────────────────────── */}
      {(isAnalyzing || isCompleteStreaming) && (
        <>
          {hasAnalysis && (
            <SchoolplanUpload
              fileName={analysis.file_name}
              uploadedAt={analysis.uploaded_at}
              pageCount={analysis.page_count}
              onReplace={handleReplace}
            />
          )}
          <SchoolplanStreamingProgress currentStep={streamingStep} />
        </>
      )}

      {/* ── State D: Error (analysis failed) ───────────────────────────────── */}
      {!isAnalyzing && !isCompleteStreaming && isFailed && (
        <>
          <SchoolplanUpload
            fileName={analysis!.file_name}
            uploadedAt={analysis!.uploaded_at}
            pageCount={analysis!.page_count}
            onReplace={handleReplace}
          />
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-4 text-center">
            <p className="text-sm text-neutral-700">
              De analyse is mislukt. Probeer het opnieuw of neem contact op met ondersteuning.
            </p>
            {analysis!.error_message && (
              <p className="text-xs text-red-500 mt-2 font-mono">
                {analysis!.error_message}
              </p>
            )}
            <button
              type="button"
              onClick={() => handleUpload(new File([], analysis!.file_name))}
              className="mt-3 px-4 py-2 bg-cito-primary text-white rounded text-sm font-semibold hover:bg-cito-primary/90"
            >
              Opnieuw proberen
            </button>
          </div>
        </>
      )}

      {/* ── State C: Results ───────────────────────────────────────────────── */}
      {!isAnalyzing && !isCompleteStreaming && isComplete && (
        <>
          <SchoolplanUpload
            fileName={analysis!.file_name}
            uploadedAt={analysis!.uploaded_at}
            pageCount={analysis!.page_count}
            onReplace={handleReplace}
          />

          {/* Non-schoolplan warning */}
          {!isSchoolplan && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-4">
              <p className="text-sm text-neutral-700">
                Dit document lijkt geen schoolplan te zijn. Upload een schoolplan om kansen te
                identificeren.
              </p>
            </div>
          )}

          {/* Schoolplan results */}
          {isSchoolplan && (
            <>
              <SchoolplanSummary summary={analysis!.summary} />
              <KansCardList
                opportunities={analysis!.opportunities}
                alsoRelevant={analysis!.also_relevant}
                annotations={analysis!.opportunity_annotations}
                onAnnotationChange={handleAnnotationChange}
              />
            </>
          )}
        </>
      )}

      {/* ── State A: Empty (no analysis, or stuck pending from previous attempt) */}
      {!isAnalyzing && !isCompleteStreaming && (!hasAnalysis || isPending) && (
        <>
          <DocumentDropzone
            onFileSelected={handleUpload}
            isProcessing={isUploading}
            error={uploadError ?? undefined}
          />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-neutral-700 mt-6">
              Nog geen schoolplan geupload
            </h3>
            <p className="text-sm text-neutral-400 mt-2 max-w-md mx-auto">
              Upload het schoolplan van deze school om automatisch Cito-kansen te identificeren en
              concurrentie-inzichten te genereren.
            </p>
          </div>
        </>
      )}

      {/* ── Replace confirmation dialog ────────────────────────────────────── */}
      {showReplaceConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm shadow-xl">
            <p className="text-sm text-neutral-700">
              Weet u zeker dat u het schoolplan wilt vervangen? Alle huidige kansen en notities
              worden verwijderd.
            </p>
            <div className="flex gap-3 mt-4 justify-end">
              <button
                type="button"
                onClick={() => setShowReplaceConfirm(false)}
                className="px-4 py-2 text-sm text-neutral-600 border border-neutral-200 rounded hover:bg-neutral-50"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleConfirmReplace}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 font-semibold"
              >
                Ja, vervangen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
