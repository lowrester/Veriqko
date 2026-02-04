#!/bin/bash
#===============================================================================
# Update Veriqko Deployment
#
# Pulls latest code from GitHub and updates the running application
#
# Usage:
#   ./update-deployment.sh
#===============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[UPDATE]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

VERIQKO_HOME="/opt/veriqko"

log "Updating Veriqko deployment..."

# Pull latest code
log "Pulling latest code from GitHub..."
cd $VERIQKO_HOME/app
sudo -u veriqko git pull origin main

# Update backend dependencies
log "Updating backend dependencies..."
cd $VERIQKO_HOME/app/apps/api
sudo -u veriqko ./venv/bin/pip install --upgrade pip
sudo -u veriqko ./venv/bin/pip install -r requirements.txt

# Run database migrations
log "Running database migrations..."
sudo -u veriqko ./venv/bin/alembic upgrade head

# Build frontend
log "Building frontend..."
cd $VERIQKO_HOME/app/apps/web
sudo -u veriqko npm install
sudo -u veriqko npm run build

# Restart services
log "Restarting services..."
sudo systemctl restart veriqko-api
sudo systemctl reload nginx

# Check status
log "Checking service status..."
sudo systemctl status veriqko-api --no-pager || true

echo ""
echo "=============================================="
echo -e "${GREEN}UPDATE COMPLETE!${NC}"
echo "=============================================="
echo ""
echo "Services restarted successfully"
echo ""
