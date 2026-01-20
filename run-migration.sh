#!/bin/bash
# =============================================================================
# Hybrid Search Migration Script
# Run: chmod +x run-migration.sh && ./run-migration.sh
# =============================================================================

set -e

CONTAINER="${COMPOSE_PROJECT_NAME:-peerzee-fullstack}-postgres-1"
DB_USER="${DB_USER:-peerzee}"
DB_NAME="${DB_NAME:-peerzee-db}"

echo "🚀 Running Hybrid Search Migration..."

# Run migration
docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < peerzee-backend/migrations/hybrid_search.sql

echo ""
echo "✅ Migration completed!"
echo ""
echo "Verifying..."
docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT column_name, udt_name FROM information_schema.columns WHERE table_name='user_profiles' AND column_name IN ('gender','city','bioEmbedding');"
