#!/bin/sh
set -e

echo "🚀 Starting G-Bridge Backend..."

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
until nc -z mysql 3306; do
  echo "   MySQL is unavailable - sleeping"
  sleep 2
done
echo "✓ MySQL is ready"

# Wait a bit more for MySQL to fully initialize
sleep 3

# Create admin user if environment variables are set
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "🔐 Creating admin user from environment variables..."
  npm run create-admin || {
    echo "⚠️  Warning: Admin creation failed or admin already exists, continuing..."
  }
else
  echo "ℹ️  Skipping admin creation (ADMIN_EMAIL or ADMIN_PASSWORD not set)"
fi

# Run seed script (it will check internally and only seed if needed)
echo "🌱 Running demo data seed script..."
echo "   (Script will automatically skip if data already exists)"
npm run seed:demo || {
  echo "⚠️  Warning: Seed script failed or skipped, but continuing to start server..."
}

# Run subscription plans seed script
echo "📋 Running subscription plans seed script..."
echo "   (Script will automatically update existing plans or create new ones)"
npm run seed:subscriptions || {
  echo "⚠️  Warning: Subscription plans seed script failed, but continuing to start server..."
}

# Start the server
echo "🚀 Starting backend server..."
exec "$@"

