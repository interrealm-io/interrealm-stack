#!/bin/sh
set -e

echo "==========================================="
echo "InterRealm Broker - Starting..."
echo "==========================================="

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" > /dev/null 2>&1; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is ready!"

# Apply Prisma schema to database
echo "Applying Prisma schema to database..."
npx prisma db push --skip-generate --accept-data-loss

echo "Database schema is up to date!"
echo ""
echo "==========================================="
echo "Starting Broker Service..."
echo "  Internal Gateway: ws://0.0.0.0:${INTERNAL_PORT}"
echo "  External Gateway: ws://0.0.0.0:${EXTERNAL_PORT}"
echo "  Admin API:        http://0.0.0.0:${ADMIN_PORT}"
echo "==========================================="
echo ""

# Execute the main command
exec "$@"
