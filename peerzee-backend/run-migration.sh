#!/bin/bash
set -e

# Helper function to run SQL file
run_sql_file() {
    echo "Running migration: $1"
    cat "$1" | docker compose exec -T postgres psql -U peerzee -d peerzee-db
}

# Run existing migrations
echo "Starting migrations..."
for file in ./migrations/*.sql; do
    if [ -f "$file" ]; then
        run_sql_file "$file"
    fi
done

echo "Migrations completed successfully."
