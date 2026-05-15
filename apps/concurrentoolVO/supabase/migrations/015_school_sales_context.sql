-- =============================================================================
-- 015_school_sales_context.sql — Phase 27 Plan 03 (R3 + R4)
-- Sales-context fields op de schools tabel: klant-type (huidige Cito-klant /
-- nieuwe prospect / gedeeltelijk), schoolsoort-variant (regulier / dakpanklas /
-- dalton / montessori / vrije-school / overig + free-text customSchoolType),
-- en groei-trajectorie (groei / krimp / stabiel / loting).
--
-- Alle kolommen zijn nullable TEXT — front-end Zod valideert het enum-bereik,
-- geen DB CHECK-constraint (D-18 simplicity, plan 27-03 § threat-model
-- T-27-03-03). RLS op de schools tabel beschermt de nieuwe kolommen
-- automatisch (geërfd uit migratie 002_rls_policies.sql).
-- =============================================================================

ALTER TABLE schools
  ADD COLUMN customer_type TEXT,
  ADD COLUMN school_type TEXT,
  ADD COLUMN custom_school_type TEXT,
  ADD COLUMN growth_trajectory TEXT;
