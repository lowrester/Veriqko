#!/bin/bash
#===============================================================================
# Veriqko Platform Update Script
#
# Smart rolling update: pulls latest main branch, detects dependency changes,
# only reinstalls what changed, handles migration failures with rollback,
# and rolls back the entire update if the health check fails.
#
# Usage:
#   sudo bash update.sh [options]
#
# Options:
#   --full          Force full reinstall (wipe node_modules, reinstall all deps)
#   --api           Update backend only
#   --web           Update frontend only
#   --no-migrate    Skip database migrations
#   --no-rollback   Disable automatic rollback on failure
#   --help          Show this help
#
# Examples:
#   sudo bash update.sh                  # Standard update
#   sudo bash update.sh --full           # Full reinstall
#   sudo bash update.sh --api --no-migrate  # Backend only, skip migrations
#===============================================================================

set -euo pipefail

#===============================================================================
# Configuration
#===============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
API_DIR="$APP_DIR/apps/api"
WEB_DIR="$APP_DIR/apps/web"
VERIQKO_HOME="/opt/veriqko"
LOGS_DIR="$VERIQKO_HOME/logs"
BACKUPS_DIR="$VERIQKO_HOME/backups"
GITHUB_KEY="$VERIQKO_HOME/.ssh/github_deploy"
BRANCH="main"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()     { echo -e "${GREEN}[UPDATE]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
step()    { echo -e "\n${BOLD}${CYAN}━━━ $1 ━━━${NC}\n"; }
divider() { echo -e "${YELLOW}================================================================${NC}"; }

#===============================================================================
# Parse Arguments
#===============================================================================

UPDATE_API=true
UPDATE_WEB=true
RUN_MIGRATIONS=true
FULL_UPDATE=false
AUTO_ROLLBACK=true

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --full)         FULL_UPDATE=true ;;
        --api)          UPDATE_API=true; UPDATE_WEB=false ;;
        --web)          UPDATE_WEB=true; UPDATE_API=false ;;
        --no-migrate)   RUN_MIGRATIONS=false ;;
        --no-rollback)  AUTO_ROLLBACK=false ;;
        --help)
            sed -n '/^# Usage/,/^#====/p' "$0" | grep "^#" | sed 's/^# \?//'
            exit 0
            ;;
        *) error "Unknown option: $1. Use --help for usage." ;;
    esac
    shift
done

# Must run as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root: sudo bash update.sh"
fi

# Detect veriqko user
if id "veriqko" &>/dev/null; then
    VERIQKO_USER="veriqko"
elif id "veriqo" &>/dev/null; then
    VERIQKO_USER="veriqo"
else
    error "No veriqko user found. Run deploy-ubuntu.sh first."
fi

log "Starting Veriqko platform update..."
log "User: $VERIQKO_USER | API: $UPDATE_API | Web: $UPDATE_WEB | Migrations: $RUN_MIGRATIONS | Full: $FULL_UPDATE"

#===============================================================================
# Helper: run as veriqko user with SSH
#===============================================================================

run_as_veriqko() {
    sudo -u "$VERIQKO_USER" \
        GIT_SSH_COMMAND="ssh -i $GITHUB_KEY -o StrictHostKeyChecking=no" \
        "$@"
}

#===============================================================================
# Rollback State
#===============================================================================

PREV_SHA=""
PREV_ALEMBIC_REV=""
ROLLBACK_TRIGGERED=false

rollback() {
    if [ "$AUTO_ROLLBACK" = false ] || [ "$ROLLBACK_TRIGGERED" = true ]; then
        return
    fi
    ROLLBACK_TRIGGERED=true

    warn ""
    warn "━━━ ROLLBACK TRIGGERED ━━━"
    warn "Restoring previous state..."

    # Restore git state
    if [ -n "$PREV_SHA" ]; then
        warn "Reverting git to $PREV_SHA..."
        cd "$APP_DIR"
        run_as_veriqko git reset --hard "$PREV_SHA" 2>/dev/null || true
    fi

    # Restore alembic revision
    if [ -n "$PREV_ALEMBIC_REV" ] && [ "$RUN_MIGRATIONS" = true ]; then
        warn "Reverting database to revision $PREV_ALEMBIC_REV..."
        run_as_veriqko \
            PYTHONPATH="$API_DIR/src" \
            "$API_DIR/.venv/bin/alembic" downgrade "$PREV_ALEMBIC_REV" 2>/dev/null || \
            warn "Alembic rollback failed — manual intervention may be required."
    fi

    # Reinstall old backend deps
    if [ -f "$API_DIR/requirements.txt" ]; then
        warn "Reinstalling previous backend dependencies..."
        run_as_veriqko "$API_DIR/.venv/bin/pip" install \
            --no-cache-dir -r "$API_DIR/requirements.txt" -q 2>/dev/null || true
    fi

    # Restart services with old code
    warn "Restarting services with previous code..."
    systemctl restart veriqko-api 2>/dev/null || true
    systemctl reload nginx 2>/dev/null || true

    warn ""
    warn "Rollback complete. Check logs:"
    warn "  journalctl -u veriqko-api -n 50"
    warn "  tail -f $LOGS_DIR/api-error.log"
}

# Register rollback on any unexpected exit
trap 'if [ $? -ne 0 ] && [ "$ROLLBACK_TRIGGERED" = false ]; then rollback; fi' EXIT

#===============================================================================
# Step 1: Snapshot Current State
#===============================================================================

step "1 — Snapshot Current State"

cd "$APP_DIR"

# Record current git SHA
PREV_SHA=$(run_as_veriqko git rev-parse HEAD 2>/dev/null || echo "")
log "Current commit: ${PREV_SHA:0:12}"

# Record current alembic revision
if [ "$RUN_MIGRATIONS" = true ] && [ -d "$API_DIR" ]; then
    PREV_ALEMBIC_REV=$(run_as_veriqko \
        PYTHONPATH="$API_DIR/src" \
        "$API_DIR/.venv/bin/alembic" current 2>/dev/null | \
        grep -oE '[a-f0-9]{12}' | head -1 || echo "")
    log "Current alembic revision: ${PREV_ALEMBIC_REV:-none}"
fi

# Snapshot dependency files for diffing
PREV_REQUIREMENTS_HASH=""
PREV_PACKAGE_JSON_HASH=""

if [ -f "$API_DIR/requirements.txt" ]; then
    PREV_REQUIREMENTS_HASH=$(md5sum "$API_DIR/requirements.txt" | awk '{print $1}')
fi
if [ -f "$WEB_DIR/package.json" ]; then
    PREV_PACKAGE_JSON_HASH=$(md5sum "$WEB_DIR/package.json" | awk '{print $1}')
fi

log "Dependency snapshots recorded"

#===============================================================================
# Step 2: Pull Latest Code
#===============================================================================

step "2 — Pull Latest Code"

log "Fetching from origin/$BRANCH..."
run_as_veriqko git fetch origin "$BRANCH" || \
    error "Git fetch failed. Check SSH key and GitHub connectivity."

NEW_SHA=$(run_as_veriqko git rev-parse "origin/$BRANCH")
log "Remote commit: ${NEW_SHA:0:12}"

if [ "$PREV_SHA" = "$NEW_SHA" ]; then
    log "Already up to date (${NEW_SHA:0:12}). No code changes."
    # Still continue — deps or infra may need updating
fi

run_as_veriqko git reset --hard "origin/$BRANCH"
log "Code updated to ${NEW_SHA:0:12}"

# Show what changed
CHANGED_FILES=$(run_as_veriqko git diff --name-only "$PREV_SHA" "$NEW_SHA" 2>/dev/null | head -20 || echo "")
if [ -n "$CHANGED_FILES" ]; then
    log "Changed files:"
    echo "$CHANGED_FILES" | while read -r f; do log "  • $f"; done
fi

#===============================================================================
# Step 3: Backend Update
#===============================================================================

if [ "$UPDATE_API" = true ]; then
    step "3 — Backend Update"

    cd "$API_DIR"

    # Ensure venv exists
    if [ ! -d ".venv" ]; then
        warn "Virtual environment not found — creating..."
        run_as_veriqko python3.11 -m venv .venv
        # Force full reinstall since venv is new
        FULL_UPDATE=true
    fi

    # Check if requirements changed
    NEW_REQUIREMENTS_HASH=""
    if [ -f "requirements.txt" ]; then
        NEW_REQUIREMENTS_HASH=$(md5sum "requirements.txt" | awk '{print $1}')
    fi

    if [ "$FULL_UPDATE" = true ] || [ "$PREV_REQUIREMENTS_HASH" != "$NEW_REQUIREMENTS_HASH" ]; then
        log "requirements.txt changed (or --full). Reinstalling backend dependencies..."
        run_as_veriqko .venv/bin/pip install --upgrade pip --quiet
        if [ -f "requirements.txt" ]; then
            run_as_veriqko .venv/bin/pip install --no-cache-dir -r requirements.txt || {
                warn "requirements.txt install failed, trying pyproject.toml..."
                run_as_veriqko .venv/bin/pip install --no-cache-dir -e ".[dev]" || \
                    error "Backend dependency installation failed."
            }
        elif [ -f "pyproject.toml" ]; then
            run_as_veriqko .venv/bin/pip install --no-cache-dir -e ".[dev]" || \
                error "Backend dependency installation failed."
        fi
        log "Backend dependencies updated"
    else
        log "requirements.txt unchanged — skipping pip install"
    fi

    # Run migrations
    if [ "$RUN_MIGRATIONS" = true ]; then
        log "Running database migrations..."
        MIGRATION_OK=false

        run_as_veriqko \
            PYTHONPATH="$API_DIR/src" \
            "$API_DIR/.venv/bin/alembic" upgrade head && MIGRATION_OK=true || true

        if [ "$MIGRATION_OK" = false ]; then
            warn "Migration failed. Attempting rollback to $PREV_ALEMBIC_REV..."
            if [ -n "$PREV_ALEMBIC_REV" ]; then
                run_as_veriqko \
                    PYTHONPATH="$API_DIR/src" \
                    "$API_DIR/.venv/bin/alembic" downgrade "$PREV_ALEMBIC_REV" 2>/dev/null || \
                    warn "Alembic downgrade also failed — database may need manual repair."
            fi
            error "Database migration failed and was rolled back. Fix migration files and retry."
        fi

        log "Migrations applied successfully"
    else
        log "Skipping migrations (--no-migrate)"
    fi
fi

#===============================================================================
# Step 4: Frontend Update
#===============================================================================

if [ "$UPDATE_WEB" = true ]; then
    step "4 — Frontend Update"

    cd "$WEB_DIR"

    # Check if package.json changed
    NEW_PACKAGE_JSON_HASH=""
    if [ -f "package.json" ]; then
        NEW_PACKAGE_JSON_HASH=$(md5sum "package.json" | awk '{print $1}')
    fi

    DEPS_CHANGED=false
    if [ "$FULL_UPDATE" = true ] || [ "$PREV_PACKAGE_JSON_HASH" != "$NEW_PACKAGE_JSON_HASH" ]; then
        DEPS_CHANGED=true
    fi

    if [ "$DEPS_CHANGED" = true ]; then
        log "package.json changed (or --full). Reinstalling frontend dependencies..."

        if [ "$FULL_UPDATE" = true ]; then
            log "Full update: removing node_modules and dist..."
            rm -rf node_modules dist
        fi

        FRONTEND_DEPS_OK=false

        # Try npm ci first (fast, reproducible)
        if [ -f "package-lock.json" ] && [ "$FULL_UPDATE" = false ]; then
            run_as_veriqko npm ci --prefer-offline 2>/dev/null && FRONTEND_DEPS_OK=true || true
        fi

        # Fallback: wipe and npm install
        if [ "$FRONTEND_DEPS_OK" = false ]; then
            warn "npm ci failed or not applicable. Wiping node_modules and running npm install..."
            rm -rf node_modules package-lock.json
            run_as_veriqko npm install && FRONTEND_DEPS_OK=true || true
        fi

        if [ "$FRONTEND_DEPS_OK" = false ]; then
            error "Frontend dependency installation failed."
        fi

        log "Frontend dependencies updated"
    else
        log "package.json unchanged — skipping npm install"
    fi

    log "Building frontend..."
    run_as_veriqko npm run build || error "Frontend build failed."
    log "Frontend built successfully"
fi

#===============================================================================
# Step 5: Restart Services
#===============================================================================

step "5 — Restart Services"

log "Restarting veriqko-api..."
if systemctl is-enabled veriqko-api &>/dev/null; then
    systemctl restart veriqko-api
    log "veriqko-api restarted"
else
    warn "veriqko-api service not found. Run deploy-platform-v2.sh to set it up."
fi

log "Reloading nginx..."
if systemctl is-active nginx &>/dev/null; then
    nginx -t && systemctl reload nginx || warn "Nginx reload failed — check config."
else
    warn "Nginx is not running."
fi

#===============================================================================
# Step 6: Health Check
#===============================================================================

step "6 — Health Check"

log "Waiting for API to come up..."
HEALTH_OK=false
for i in $(seq 1 15); do
    sleep 4
    # Check if systemd service is active
    if ! systemctl is-active veriqko-api &>/dev/null; then
        log "  Waiting... (service not active yet)"
        continue
    fi
    
    # Check API on localhost
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/health 2>/dev/null || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        HEALTH_OK=true
        break
    fi
    log "  Waiting... ($((i*4))s, status: $HTTP_STATUS)"
done

if [ "$HEALTH_OK" = true ]; then
    log "✅ Health check passed — API is healthy on localhost:8000"
else
    warn "⚠️  Health check failed after 60s (status: $HTTP_STATUS)"
    if [ "$AUTO_ROLLBACK" = true ]; then
        warn "Triggering automatic rollback..."
        rollback
        error "Update failed health check. Rolled back to ${PREV_SHA:0:12}."
    else
        warn "Auto-rollback disabled. Check logs manually:"
        warn "  journalctl -u veriqko-api -n 50"
        warn "  tail -f $LOGS_DIR/api-error.log"
    fi
fi

# Disable the rollback trap — update succeeded
trap - EXIT

#===============================================================================
# Summary
#===============================================================================

echo ""
divider
echo -e "${BOLD}${GREEN}  ✅ VERIQKO PLATFORM UPDATED SUCCESSFULLY${NC}"
divider
echo ""
echo "  Previous commit: ${PREV_SHA:0:12}"
echo "  Current commit:  ${NEW_SHA:0:12}"
echo ""
echo "  Useful commands:"
echo "    systemctl status veriqko-api"
echo "    journalctl -u veriqko-api -f"
echo "    tail -f $LOGS_DIR/api.log"
echo ""
divider
