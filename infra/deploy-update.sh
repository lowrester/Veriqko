#!/bin/bash
set -e

# Veriqo Deployment Update Script
# This script safely updates the Veriqo application on the server

echo "🚀 Starting Veriqo deployment update..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/veriqo/app"
WEB_DIR="$APP_DIR/apps/web"
API_DIR="$APP_DIR/apps/api"
VERIQO_USER="veriqo"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Navigate to app directory
cd "$APP_DIR" || exit 1

echo -e "${BLUE}📦 Cleaning generated files...${NC}"
# Remove generated files that might conflict with git pull
sudo -u "$VERIQO_USER" rm -rf "$WEB_DIR/node_modules"
sudo -u "$VERIQO_USER" rm -rf "$WEB_DIR/dist"
sudo -u "$VERIQO_USER" rm -f "$WEB_DIR/package-lock.json"

echo -e "${BLUE}📥 Pulling latest changes from GitHub...${NC}"
# Pull latest changes
sudo -u "$VERIQO_USER" git fetch origin
sudo -u "$VERIQO_USER" git pull origin main

echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
# Install frontend dependencies
cd "$WEB_DIR" || exit 1
sudo -u "$VERIQO_USER" npm install

echo -e "${BLUE}🔨 Building frontend...${NC}"
# Build frontend
sudo -u "$VERIQO_USER" npm run build

echo -e "${BLUE}🔄 Restarting services...${NC}"
# Restart API service
systemctl restart veriqo-api

# Reload nginx
systemctl reload nginx

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📊 Service Status:${NC}"
systemctl status veriqo-api --no-pager -l | head -n 10
echo ""
echo -e "${YELLOW}🌐 Application should be available at: http://$(hostname -I | awk '{print $1}')/${NC}"
