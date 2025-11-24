#!/bin/bash
# Production startup script

echo "🚀 Starting Poky-fy Import & Copy Products in Production..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Push database schema (creates tables if they don't exist)
echo "🗄️  Syncing database schema..."
npx prisma db push --skip-generate

# Build the application
echo "🔨 Building application..."
npm run build

# Start the server
echo "✅ Starting server..."
npm start
