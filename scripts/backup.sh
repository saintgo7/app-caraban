#!/bin/bash

# Database Backup Script for Caraban Camping Platform
# This script creates daily backups of the MariaDB database

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
MYSQL_HOST="${MYSQL_HOST:-mariadb}"
MYSQL_USER="${MYSQL_USER:-caraban}"
MYSQL_PASSWORD="${MYSQL_PASSWORD}"
MYSQL_DATABASE="${MYSQL_DATABASE:-caraban_production}"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/caraban_db_backup_$TIMESTAMP.sql.gz"

echo "Starting backup at $(date)"
echo "Backup file: $BACKUP_FILE"

# Create backup
mysqldump \
  --host="$MYSQL_HOST" \
  --user="$MYSQL_USER" \
  --password="$MYSQL_PASSWORD" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  "$MYSQL_DATABASE" | gzip > "$BACKUP_FILE"

# Verify backup was created
if [ -f "$BACKUP_FILE" ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "Backup completed successfully. Size: $BACKUP_SIZE"
else
  echo "ERROR: Backup failed!"
  exit 1
fi

# Remove old backups (keep only last 30 days)
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "caraban_db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "caraban_db_backup_*.sql.gz" | wc -l)
echo "Current backup count: $BACKUP_COUNT"

echo "Backup process completed at $(date)"
