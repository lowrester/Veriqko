#!/bin/bash
#===============================================================================
# Update Veriqo Deployment
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

VERIQO_HOME="/opt/veriqo"

log "Updating Veriqo deployment..."

# Pull latest code
log "Pulling latest code from GitHub..."
cd $VERIQO_HOME/app
sudo -u veriqo git pull origin main

# Update backend dependencies
log "Updating backend dependencies..."
cd $VERIQO_HOME/app/apps/api
sudo -u veriqo ./venv/bin/pip install --upgrade pip
sudo -u veriqo ./venv/bin/pip install -r requirements.txt

# Run database migrations
log "Running database migrations..."
sudo -u veriqo ./venv/bin/alembic upgrade head

# Build frontend
log "Building frontend..."
cd $VERIQO_HOME/app/apps/web
sudo -u veriqo npm install
sudo -u veriqo npm run build

# Restart services
log "Restarting services..."
sudo systemctl restart veriqo-api
sudo systemctl reload nginx

# Check status
log "Checking service status..."
sudo systemctl status veriqo-api --no-pager || true

echo ""
echo "=============================================="
echo -e "${GREEN}UPDATE COMPLETE!${NC}"
echo "=============================================="
echo ""
echo "Services restarted successfully"
echo ""
