#!/bin/bash

# seed-db.sh - Populate the database with test data
# Usage: ./seed-db.sh --force [--allow-production]

set -e

FORCE=false
ALLOW_PRODUCTION=false

for arg in "$@"; do
    case "$arg" in
        --force)
            FORCE=true
            ;;
        --allow-production)
            ALLOW_PRODUCTION=true
            ;;
        -h|--help)
            echo "Usage: ./seed-db.sh --force [--allow-production]"
            echo ""
            echo "  --force             Required. Prevents accidental data changes."
            echo "  --allow-production  Required in addition to --force when NODE_ENV=production."
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $arg"
            echo "Usage: ./seed-db.sh --force [--allow-production]"
            exit 1
            ;;
    esac
done

if [ "$FORCE" != "true" ]; then
    echo "❌ Refusing to seed without explicit confirmation."
    echo "   Re-run with: ./seed-db.sh --force"
    exit 1
fi

if [ "${NODE_ENV:-}" = "production" ] && [ "$ALLOW_PRODUCTION" != "true" ]; then
    echo "❌ NODE_ENV=production detected."
    echo "   Re-run with: ./seed-db.sh --force --allow-production"
    exit 1
fi

echo "🌱 Database Seeding Script"
echo "=========================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Please run 'npm install' first."
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Checking .env file..."
    if [ -f ".env" ]; then
        source .env
        if [ -z "$DATABASE_URL" ]; then
            echo "❌ DATABASE_URL not found in .env file"
            exit 1
        fi
        echo "✅ Found DATABASE_URL in .env"
    else
        echo "❌ No .env file found"
        exit 1
    fi
fi

# Check if ts-node is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please ensure Node.js is installed."
    exit 1
fi

# Check if database is accessible
echo "🔍 Checking database connection..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" &> /dev/null; then
    echo "❌ Could not connect to database. Is it running?"
    echo "   Try running: ./start.sh (or ./docker-start.sh for Docker)"
    exit 1
fi
echo "✅ Database connection successful"
echo ""

# Run migrations to ensure schema is up to date
echo "🔄 Running migrations..."
npx prisma migrate deploy
echo ""

# Run the seed script
echo "🌱 Running seed script..."
npx prisma db seed
echo ""

echo "✅ Database seeding complete!"
echo ""
echo "🎉 You can now log in with:"
echo "   Owner: test@example.com / password123"
echo "   Viewer: viewer@example.com / viewer123"
echo ""
echo "📝 The trip includes:"
echo "   • 2 confirmed flights"
echo "   • 1 confirmed hotel"
echo "   • 2 confirmed restaurants (+ 2 ideas)"
echo "   • 3 confirmed activities (+ 3 ideas)"
echo "   • 3 car rental ideas"
echo ""
