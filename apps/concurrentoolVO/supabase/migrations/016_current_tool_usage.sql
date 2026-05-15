-- =============================================================================
-- 016_current_tool_usage.sql — Phase 27 Plan 05 (R5)
-- Per-niveau huidig-gebruik op de schools tabel: welk toetspakket gebruikt
-- de school nu op elk onderwijsniveau (Cito / DIA / JIJ! / Mix / Geen).
--
-- Vorm: JSONB-object met SchoolLevel-keys (e.g. {"havo": "cito", "vwo": "dia"}).
-- Default `{}` zodat bestaande rijen een neutrale aggregatie behouden — de
-- frontend-aggregatie (`getStichtingUsageMix`) classificeert een lege map
-- als `'unknown'` (zie src/models/stichting.ts).
--
-- Geen DB CHECK-constraint: front-end Zod valideert enum-bereik + level-keys
-- (zie src/features/school-profile/schemas/step2-schema.ts). Worst case bij
-- buiten-bereik waarde: aggregatie-helper skipt unknown enum (mitigation
-- T-27-05-01). RLS op de schools tabel beschermt automatisch (002).
-- =============================================================================

ALTER TABLE schools
  ADD COLUMN current_tool_usage JSONB NOT NULL DEFAULT '{}'::jsonb;
