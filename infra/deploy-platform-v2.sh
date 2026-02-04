#!/bin/bash
set -e

# Veriqko Platform V2 Deployment Script
# This script deploys the new platform version

echo "🚀 Starting Veriqko Platform V2 deployment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/veriqko/app"
WEB_DIR="$APP_DIR/apps/web"
API_DIR="$APP_DIR/apps/api"
VERIQKO_USER="veriqko"
BRANCH="main"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1

fi

echo -e "${BLUE}🔧 Checking system dependencies...${NC}"
# Install required system packages
apt-get update
apt-get install -y python3-venv python3-pip

# Navigate to app directory
cd "$APP_DIR" || exit 1

echo -e "${BLUE}📥 Switching to branch $BRANCH...${NC}"
# Fetch and checkout branch
sudo -u "$VERIQKO_USER" git fetch origin
sudo -u "$VERIQKO_USER" git reset --hard origin/$BRANCH

echo -e "${BLUE}📦 Cleaning generated files...${NC}"
# Remove generated files to avoid conflicts
sudo -u "$VERIQKO_USER" rm -rf "$WEB_DIR/node_modules"
sudo -u "$VERIQKO_USER" rm -rf "$WEB_DIR/dist"
sudo -u "$VERIQKO_USER" rm -f "$WEB_DIR/package-lock.json"

echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
# Install properties
cd "$WEB_DIR" || exit 1
sudo -u "$VERIQKO_USER" npm install

echo -e "${BLUE}🔨 Building frontend...${NC}"
# Build frontend
sudo -u "$VERIQKO_USER" npm run build

echo -e "${BLUE}🐍 Installing backend dependencies...${NC}"
cd "$API_DIR" || exit 1

# Ensure venv exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    sudo -u "$VERIQKO_USER" python3 -m venv .venv
fi

# Install requirements
sudo -u "$VERIQKO_USER" "$API_DIR/.venv/bin/pip" install --no-cache-dir -r requirements.txt

echo -e "${BLUE}🗄️ Running database migrations...${NC}"
sudo -u "$VERIQKO_USER" PYTHONPATH="$API_DIR/src" "$API_DIR/.venv/bin/alembic" upgrade head

echo -e "${BLUE}🔄 Restarting services...${NC}"
systemctl restart veriqko-api
systemctl reload nginx

echo -e "${GREEN}✅ Platform V2 deployed successfully!${NC}"
echo -e "${YELLOW}🌐 Access at: http://$(hostname -I | awk '{print $1}')/${NC}"
