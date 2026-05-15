// Shared types for the pricing feature.
// Consumed by PrijzenPage and the downstream tab/export/import flows.

/** Primary tab on the /prijzen editor. */
export type PrijzenTab = 'basis' | 'concurrentie';

/**
 * Sub-tab under "concurrentie". First two are provider-specific (show that provider's
 * full pricing form). Last three are cross-provider category views (show modules
 * of that category from all competing providers side-by-side).
 *
 * SAQI is intentionally NOT a top-level sub-tab — SAQI only offers sociaal-emotioneel,
 * so it appears within the "sociaal-emotioneel" category view alongside DIA and JIJ.
 */
export type ConcurrentieSubTab =
  | 'dia'
  | 'jij'
  | 'sociaal-emotioneel'
  | 'executieve'
  | 'overig';

/** TanStack Router search-param shape for /prijzen (deeplinkable + refresh-safe — see D-02). */
export interface PrijzenSearchParams {
  tab?: PrijzenTab;
  /** Sub-tab in the Concurrentie tab. Defaults to 'dia' when tab === 'concurrentie'. */
  sub?: ConcurrentieSubTab;
}
