#!/bin/bash
#===============================================================================
# Veriqko — Proxmox Host Cleanup Script
#
# Cleans up artifacts left on the Proxmox HOST after running deploy-proxmox.sh
# or deploy-ubuntu.sh. Does NOT touch the VM itself.
#
# What it removes:
#   - Temporary cloud-init snippets (/var/lib/vz/snippets/veriqko*)
#   - Cached Ubuntu cloud image (optional — large file, ~600MB)
#   - Proxmox host deploy SSH key (optional — keep if you want SSH access to VM)
#   - Credentials file (optional — only after you've saved them elsewhere)
#   - /root/veriqko-env.sh (temp env file)
#
# Usage:
#   bash proxmox-cleanup.sh [--all] [--keep-image] [--keep-key] [--keep-creds]
#
# Options:
#   --all          Remove everything including image, key, and credentials
#   --keep-image   Keep the Ubuntu cloud image (default: ask)
#   --keep-key     Keep the Proxmox host SSH key (default: ask)
#   --keep-creds   Keep the credentials file (default: ask)
#   --dry-run      Show what would be removed without removing anything
#===============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()     { echo -e "${GREEN}[CLEANUP]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
removed() { echo -e "${RED}[REMOVED]${NC} $1"; }
kept()    { echo -e "${CYAN}[KEPT]${NC} $1"; }
dry()     { echo -e "${YELLOW}[DRY-RUN]${NC} Would remove: $1"; }
divider() { echo -e "${YELLOW}================================================================${NC}"; }

if ! command -v qm &>/dev/null; then
    echo "ERROR: This script must be run on a Proxmox VE host."
    exit 1
fi

if [ "$EUID" -ne 0 ]; then
    echo "ERROR: Run as root."
    exit 1
fi

#===============================================================================
# Parse arguments
#===============================================================================

REMOVE_ALL=false
KEEP_IMAGE=false
KEEP_KEY=false
KEEP_CREDS=false
DRY_RUN=false

for arg in "$@"; do
    case $arg in
        --all)        REMOVE_ALL=true ;;
        --keep-image) KEEP_IMAGE=true ;;
        --keep-key)   KEEP_KEY=true ;;
        --keep-creds) KEEP_CREDS=true ;;
        --dry-run)    DRY_RUN=true ;;
        --help)
            grep "^#" "$0" | head -30 | sed 's/^# \?//'
            exit 0
            ;;
        *) echo "Unknown option: $arg"; exit 1 ;;
    esac
done

#===============================================================================
# Helper
#===============================================================================

safe_remove() {
    local path="$1"
    local label="${2:-$1}"
    if [ -e "$path" ] || [ -L "$path" ]; then
        if [ "$DRY_RUN" = true ]; then
            dry "$label"
        else
            rm -rf "$path"
            removed "$label"
        fi
    else
        log "Not found (already clean): $label"
    fi
}

ask_remove() {
    local path="$1"
    local label="$2"
    local default_keep="$3"   # true = default keep, false = default remove

    if [ ! -e "$path" ]; then
        log "Not found (already clean): $label"
        return
    fi

    if [ "$REMOVE_ALL" = true ]; then
        safe_remove "$path" "$label"
        return
    fi

    if [ "$default_keep" = true ]; then
        read -rp "  Remove $label? [y/N] " ans
        [[ "$ans" =~ ^[Yy]$ ]] && safe_remove "$path" "$label" || kept "$label"
    else
        read -rp "  Remove $label? [Y/n] " ans
        [[ "$ans" =~ ^[Nn]$ ]] && kept "$label" || safe_remove "$path" "$label"
    fi
}

#===============================================================================
# Main cleanup
#===============================================================================

divider
echo -e "${BOLD}${CYAN}  🧹 Veriqko Proxmox Host Cleanup${NC}"
divider
echo ""

if [ "$DRY_RUN" = true ]; then
    warn "DRY RUN — nothing will actually be removed"
    echo ""
fi

#--- Always remove: temp files that are never needed after deploy ---

log "Removing temporary deployment files..."

# Cloud-init snippets
for f in /var/lib/vz/snippets/veriqko*.yml /var/lib/vz/snippets/veriqko*.yaml; do
    [ -e "$f" ] && safe_remove "$f" "cloud-init snippet: $(basename "$f")" || true
done

# Temp env file written to VM (also cleaned on VM, but may exist on host)
safe_remove "/root/veriqko-env.sh" "/root/veriqko-env.sh (temp env)"

# Any leftover deploy scripts in /tmp
for f in /tmp/veriqko-*.sh /tmp/deploy-*.sh; do
    [ -e "$f" ] && safe_remove "$f" "temp script: $(basename "$f")" || true
done

echo ""

#--- Optional: Ubuntu cloud image (~600MB) ---

if [ "$KEEP_IMAGE" = false ]; then
    echo "Ubuntu cloud images (large files, can be re-downloaded):"
    for img in /var/lib/vz/template/iso/*cloudimg*.img /var/lib/vz/template/iso/*cloud*.img; do
        [ -e "$img" ] && ask_remove "$img" "$(basename "$img") ($(du -sh "$img" 2>/dev/null | cut -f1))" false || true
    done
    echo ""
fi

#--- Optional: Proxmox host SSH key (keep if you want SSH access to VM) ---

if [ "$KEEP_KEY" = false ]; then
    echo "Proxmox host deploy SSH key (keep this if you want to SSH into the VM):"
    for keyfile in /root/.ssh/veriqko_vm_deploy /root/.ssh/veriqko_vm_deploy.pub; do
        [ -e "$keyfile" ] && ask_remove "$keyfile" "$keyfile" true || true
    done
    echo ""
fi

#--- Optional: Credentials files ---

if [ "$KEEP_CREDS" = false ]; then
    echo "Credentials files (ONLY remove after saving credentials elsewhere!):"
    for credsfile in /root/veriqko-credentials*.txt; do
        [ -e "$credsfile" ] && ask_remove "$credsfile" "$credsfile" true || true
    done
    echo ""
fi

#===============================================================================
# Summary
#===============================================================================

divider
echo ""
log "Cleanup complete."
echo ""
echo "  The VM itself was NOT touched."
echo ""
echo "  To SSH into the VM (if key was kept):"
echo "    ssh -i /root/.ssh/veriqko_vm_deploy ubuntu@<VM_IP>"
echo ""
echo "  To find the VM IP:"
echo "    qm guest cmd <VMID> network-get-interfaces"
echo ""
echo "  To destroy the VM entirely:"
echo "    qm stop <VMID> && qm destroy <VMID> --purge"
echo ""
divider
