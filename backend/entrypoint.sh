#!/bin/sh
set -e

# Wait for Postgres to be ready
echo "Waiting for Postgres..."
until pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER > /dev/null 2>&1; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done
echo "Postgres is up - continuing"

# Run Prisma migrations
echo "Running migrations..."
# Run migrations depending on environment
if [ "$NODE_ENV" = "production" ]; then
  npx prisma migrate deploy
else
  npx prisma migrate dev --name init
fi

# Run seed script
echo "Seeding database..."
if [ -f prisma/seed.ts ]; then
  echo "Running Prisma seed..."
  npx tsx prisma/seed.ts
fi

# Start the app
echo "Starting backend..."
node dist/index.js
