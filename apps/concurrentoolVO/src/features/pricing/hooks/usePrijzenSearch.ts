import { useNavigate, useSearch } from '@tanstack/react-router';
import type {
  PrijzenSearchParams,
  PrijzenTab,
  ConcurrentieSubTab,
} from '../types';

/**
 * Reads + writes /prijzen URL search params (tab, sub).
 * Tab state is URL-backed for deeplinks + refresh-safety (D-02).
 *
 * - Cito Basisvaardigheden tab has no sub-tabs (single ProviderConfigForm for Cito).
 * - Concurrentie tab has 5 sub-tabs: 2 provider-specific (dia/jij) + 3 cross-provider
 *   category views (sociaal-emotioneel/executieve/overig).
 */
export function usePrijzenSearch() {
  const search = useSearch({ strict: false }) as PrijzenSearchParams;
  const navigate = useNavigate();

  const tab: PrijzenTab = search.tab ?? 'basis';
  const sub: ConcurrentieSubTab = search.sub ?? 'dia';

  const setTab = (next: PrijzenTab) => {
    navigate({
      to: '/prijzen',
      search: (prev: PrijzenSearchParams): PrijzenSearchParams => ({
        ...prev,
        tab: next,
        // Keep `sub` only when on concurrentie tab; clear otherwise for clean URLs.
        sub: next === 'concurrentie' ? (prev.sub ?? 'dia') : undefined,
      }),
    });
  };

  const setSub = (next: ConcurrentieSubTab) => {
    navigate({
      to: '/prijzen',
      search: (prev: PrijzenSearchParams): PrijzenSearchParams => ({
        ...prev,
        tab: 'concurrentie',
        sub: next,
      }),
    });
  };

  return { tab, sub, setTab, setSub };
}
