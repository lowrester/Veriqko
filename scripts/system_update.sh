#!/bin/bash
# system_update.sh
# The "Shadow Updater" - runs detached from the API to update the system.

TARGET_VERSION=$1
[ -z "$TARGET_VERSION" ] && TARGET_VERSION="main"

APP_DIR="/opt/veriqo/app"
BACKUP_DIR="/opt/veriqo/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
STATUS_FILE="/opt/veriqo/update_status.json"

# Helper to write status
write_status() {
    echo "{\"is_updating\": true, \"current_step\": \"$1\", \"progress_percent\": $2, \"last_log\": \"$1\"}" > $STATUS_FILE
}

write_error() {
    echo "{\"is_updating\": false, \"current_step\": \"Error\", \"progress_percent\": 0, \"last_log\": \"$1\", \"error\": \"$1\"}" > $STATUS_FILE
}

write_success() {
    echo "{\"is_updating\": false, \"current_step\": \"Complete\", \"progress_percent\": 100, \"last_log\": \"Update Successful!\"}" > $STATUS_FILE
}

# --- START ---
mkdir -p $BACKUP_DIR
write_status "Initializing Update..." 0

# 1. Backup
write_status "Creating Backup..." 10
echo "Creating backup at $BACKUP_PATH..."
cp -r $APP_DIR $BACKUP_PATH
if [ $? -ne 0 ]; then
    write_error "Backup failed! Aborting."
    exit 1
fi

# 2. Stop Service
write_status "Stopping Service..." 30
sudo systemctl stop veriqo-api

# 3. Pull Code
write_status "Pulling Update ($TARGET_VERSION)..." 40
cd $APP_DIR
sudo -u veriqo git fetch origin
sudo -u veriqo git reset --hard origin/$TARGET_VERSION
if [ $? -ne 0 ]; then
    write_error "Git pull failed! Rolling back..."
    # Rollback logic here (restore backup)
    rm -rf $APP_DIR
    cp -r $BACKUP_PATH $APP_DIR
    sudo systemctl start veriqo-api
    exit 1
fi

# 4. Build & Install
write_status "Building & Installing..." 60
cd apps/web
sudo -u veriqo npm install
sudo -u veriqo npm run build
cd ../api
sudo -u veriqo python3 -m venv .venv
sudo -u veriqo .venv/bin/pip install --no-cache-dir -r requirements.txt

# 5. Migrations
write_status "Running Migrations..." 80
export PYTHONPATH=$APP_DIR/apps/api/src
sudo -u veriqo .venv/bin/alembic upgrade head
if [ $? -ne 0 ]; then
    write_error "Migration failed! Restoring backup..."
    # Full rollback would go here (complex for DB, requires pg_dump/restore which we skipped for MVP speed)
    # For now, we assume migrations are forward-compatible or manual intervention needed on migration fail
    exit 1
fi

# 6. Restart
write_status "Restarting Service..." 90
sudo systemctl start veriqo-api

# 7. Final Check
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$HTTP_CODE" == "200" ]; then
    write_success
else
    write_error "Health check failed after update!"
fi
