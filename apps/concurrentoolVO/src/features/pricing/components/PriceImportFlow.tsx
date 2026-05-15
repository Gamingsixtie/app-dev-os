/**
 * PriceImportFlow — orchestrator/modaal for the AI Excel-import flow (Phase 26-04, Task 4).
 *
 * State machine (linear):
 *   upload  → user picks provider + .xlsx
 *   aiCall  → parse Excel client-side, POST to /api/ai-price-import,
 *             validate response, compute diff
 *   diff    → user reviews per-row diff, picks accepted paths
 *   saving  → merge accepted paths into current config, write to Supabase,
 *             refresh runtime store + React Query cache
 *
 * Errors at any stage surface as Dutch messages above the active panel and
 * roll the state back to the previous safe stage (upload or diff).
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PROVIDER_CONFIGS } from '@/data/providers/index';
import { usePricingConfigs } from '@/hooks/usePricingConfigs';
import { updatePricingConfig } from '@/db/pricing-operations';
import { usePricingDataStore } from '@/stores/pricing-data-store';
import { parseExcelToRows } from '../import/excel-parser';
import { importPricesFromExcel } from '../import/ai-price-import-client';
import { computePriceDiff, applyAcceptedDiff, type DiffRow } from '../import/price-diff';
import type { ProviderImportKey } from '../import/price-import-schemas';
import { PriceImportDropzone } from './PriceImportDropzone';
import { PriceImportDiffView } from './PriceImportDiffView';

interface PriceImportFlowProps {
  open: boolean;
  onClose: () => void;
}

type Stage = 'upload' | 'aiCall' | 'diff' | 'saving';

export function PriceImportFlow({ open, onClose }: PriceImportFlowProps) {
  const queryClient = useQueryClient();
  const { data: dbConfigs } = usePricingConfigs();

  const [stage, setStage] = useState<Stage>('upload');
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ProviderImportKey | null>(null);
  const [diff, setDiff] = useState<DiffRow[]>([]);
  const [aiNotes, setAiNotes] = useState<string | undefined>(undefined);

  if (!open) return null;

  const reset = () => {
    setStage('upload');
    setError(null);
    setProvider(null);
    setDiff([]);
    setAiNotes(undefined);
  };

  const closeAll = () => {
    reset();
    onClose();
  };

  const handleSubmit = async ({
    provider: pickedProvider,
    file,
  }: {
    provider: ProviderImportKey;
    file: File;
  }) => {
    setStage('aiCall');
    setError(null);
    setProvider(pickedProvider);
    try {
      const buffer = await file.arrayBuffer();
      const rows = parseExcelToRows(buffer);
      const currentStrategy = PROVIDER_CONFIGS[pickedProvider]
        .pricingStrategy as unknown as Record<string, unknown>;
      const result = await importPricesFromExcel(pickedProvider, rows, currentStrategy);
      const diffRows = computePriceDiff(currentStrategy, result.proposed);
      setDiff(diffRows);
      setAiNotes(result.notes);
      setStage('diff');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onverwachte fout tijdens de AI-import');
      setStage('upload');
    }
  };

  const handleConfirm = async (acceptedPaths: ReadonlySet<string>) => {
    if (!provider) return;
    setStage('saving');
    setError(null);
    try {
      const currentStrategy = PROVIDER_CONFIGS[provider]
        .pricingStrategy as unknown as Record<string, unknown>;
      const merged = applyAcceptedDiff(
        currentStrategy,
        diff,
        acceptedPaths,
      ) as Record<string, unknown>;
      const dbConfig = dbConfigs?.find(
        (c) => c.provider === provider && c.is_active,
      );
      if (!dbConfig) {
        throw new Error(`Geen actieve database-configuratie gevonden voor ${provider}`);
      }
      await updatePricingConfig(dbConfig.id, merged);
      await usePricingDataStore.getState().loadFromSupabase();
      queryClient.invalidateQueries({ queryKey: ['pricing-configs'] });
      closeAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt');
      setStage('diff');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-import-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 id="price-import-title" className="text-lg font-semibold text-cito-primary">
            Importeer prijzen uit Excel
          </h2>
          <button
            type="button"
            onClick={closeAll}
            className="text-neutral-400 hover:text-neutral-700"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {(stage === 'upload' || stage === 'aiCall') && (
          <PriceImportDropzone
            onSubmit={handleSubmit}
            onCancel={closeAll}
            busy={stage === 'aiCall'}
          />
        )}

        {(stage === 'diff' || stage === 'saving') && (
          <PriceImportDiffView
            diff={diff}
            notes={aiNotes}
            onConfirm={handleConfirm}
            onCancel={closeAll}
            saving={stage === 'saving'}
          />
        )}
      </div>
    </div>
  );
}
