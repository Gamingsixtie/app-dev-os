#!/usr/bin/env bash
# One-shot script to apply all 10 migrations to concurrentool-prod Supabase.
# Run from any directory: bash apps/concurrentoolVO/migrate-to-prod.sh

set -e

# Always operate from this app's directory regardless of where the script is invoked from.
cd "$(dirname "$0")"

PROJECT_REF="xxpvreojihjtgiwrqbqn"

echo "Target: ${PROJECT_REF} (concurrentool-prod)"
echo "Migrations to apply: $(ls supabase/migrations/*.sql 2>/dev/null | wc -l) files in supabase/migrations/"
echo ""

read -srp "Paste DB password (hidden, press Enter when done): " DB_PASS
echo ""
echo ""

if [[ -z "$DB_PASS" ]]; then
  echo "Error: empty password — aborting."
  exit 1
fi

echo "Pushing migrations..."
npx -y supabase db push --db-url "postgresql://postgres:${DB_PASS}@db.${PROJECT_REF}.supabase.co:5432/postgres"

echo ""
echo "Done. concurrentool-prod is now schema-aligned with concurrentool-dev."
