#!/bin/bash
set -e

echo "☢️  VERIQO REPAIR PROTOCOL INITIATED..."

# 1. Stop Service to release file locks
echo "🛑 Stopping Veriqo API Service..."
sudo systemctl stop veriqo-api || echo "⚠️  Service was not running or could not be stopped."

# 2. Clean Backend
echo "🧹 Nuke Backend Environment..."
cd apps/api
rm -rf .venv
rm -rf __pycache__
find . -type d -name "__pycache__" -exec rm -rf {} +
echo "✅ Backend Cleaned."
cd ../..

# 3. Clean Frontend
echo "🧹 Nuke Frontend Environment..."
cd apps/web
rm -rf node_modules
rm -rf dist
echo "✅ Frontend Cleaned."
cd ../..

# 4. Clear Global Caches
echo "🧹 Clearing System Caches..."
rm -rf ~/.cache/pip
rm -rf ~/.npm

# 5. Run Standard Deployment
echo "🔄 Triggering Fresh Deployment..."
chmod +x scripts/deploy.sh
./scripts/deploy.sh
