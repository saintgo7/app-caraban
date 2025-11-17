#!/bin/bash

# MariaDB Replication Setup Script
# This script configures master-slave replication between two MariaDB instances

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
MASTER_HOST="${MASTER_HOST:-mariadb-master}"
SLAVE_HOST="${SLAVE_HOST:-mariadb-slave}"
MYSQL_ROOT_PASSWORD="${DB_ROOT_PASSWORD}"
MYSQL_DATABASE="${DB_NAME:-caraban_production}"
REPLICATION_USER="${MYSQL_REPLICATION_USER:-repl_user}"
REPLICATION_PASSWORD="${DB_REPLICATION_PASSWORD:-replication_password}"

print_info "Starting MariaDB replication setup..."
print_info "Master: $MASTER_HOST"
print_info "Slave: $SLAVE_HOST"

# Wait for master to be ready
print_info "Waiting for master database to be ready..."
until docker exec caraban-mariadb-master mysqladmin ping -h "$MASTER_HOST" -u root -p"$MYSQL_ROOT_PASSWORD" --silent 2>/dev/null; do
    sleep 2
done
print_info "✓ Master is ready"

# Wait for slave to be ready
print_info "Waiting for slave database to be ready..."
until docker exec caraban-mariadb-slave mysqladmin ping -h "$SLAVE_HOST" -u root -p"$MYSQL_ROOT_PASSWORD" --silent 2>/dev/null; do
    sleep 2
done
print_info "✓ Slave is ready"

# Create replication user on master
print_info "Creating replication user on master..."
docker exec caraban-mariadb-master mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
CREATE USER IF NOT EXISTS '$REPLICATION_USER'@'%' IDENTIFIED BY '$REPLICATION_PASSWORD';
GRANT REPLICATION SLAVE ON *.* TO '$REPLICATION_USER'@'%';
FLUSH PRIVILEGES;
EOF
print_info "✓ Replication user created"

# Get master status
print_info "Getting master binary log status..."
MASTER_STATUS=$(docker exec caraban-mariadb-master mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW MASTER STATUS\G")
MASTER_LOG_FILE=$(echo "$MASTER_STATUS" | grep "File:" | awk '{print $2}')
MASTER_LOG_POS=$(echo "$MASTER_STATUS" | grep "Position:" | awk '{print $2}')

print_info "Master log file: $MASTER_LOG_FILE"
print_info "Master log position: $MASTER_LOG_POS"

if [ -z "$MASTER_LOG_FILE" ] || [ -z "$MASTER_LOG_POS" ]; then
    print_error "Failed to get master status"
    exit 1
fi

# Configure slave
print_info "Configuring slave replication..."
docker exec caraban-mariadb-slave mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
STOP SLAVE;

CHANGE MASTER TO
    MASTER_HOST='$MASTER_HOST',
    MASTER_USER='$REPLICATION_USER',
    MASTER_PASSWORD='$REPLICATION_PASSWORD',
    MASTER_LOG_FILE='$MASTER_LOG_FILE',
    MASTER_LOG_POS=$MASTER_LOG_POS;

START SLAVE;
EOF
print_info "✓ Slave configured and started"

# Wait a moment for slave to connect
sleep 3

# Check slave status
print_info "Checking slave status..."
SLAVE_STATUS=$(docker exec caraban-mariadb-slave mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW SLAVE STATUS\G")

SLAVE_IO_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_IO_Running:" | awk '{print $2}')
SLAVE_SQL_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_SQL_Running:" | awk '{print $2}')

print_info "Slave_IO_Running: $SLAVE_IO_RUNNING"
print_info "Slave_SQL_Running: $SLAVE_SQL_RUNNING"

if [ "$SLAVE_IO_RUNNING" == "Yes" ] && [ "$SLAVE_SQL_RUNNING" == "Yes" ]; then
    print_info "✅ Replication is working correctly!"
else
    print_error "❌ Replication is not working properly"
    echo "$SLAVE_STATUS"
    exit 1
fi

# Test replication
print_info "Testing replication..."
TEST_TABLE="replication_test_$(date +%s)"

# Create test table on master
docker exec caraban-mariadb-master mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" <<EOF
CREATE TABLE IF NOT EXISTS $TEST_TABLE (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_data VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO $TEST_TABLE (test_data) VALUES ('Replication test');
EOF

# Wait for replication
sleep 2

# Check if table exists on slave
if docker exec caraban-mariadb-slave mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "SELECT * FROM $TEST_TABLE" &>/dev/null; then
    print_info "✅ Replication test successful!"

    # Clean up test table
    docker exec caraban-mariadb-master mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "DROP TABLE $TEST_TABLE"
else
    print_error "❌ Replication test failed"
    exit 1
fi

print_info ""
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "✅ MariaDB Replication Setup Complete!"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info ""
print_info "Master: $MASTER_HOST"
print_info "Slave: $SLAVE_HOST"
print_info "Database: $MYSQL_DATABASE"
print_info ""
print_info "To check replication status:"
print_info "  docker exec caraban-mariadb-slave mysql -u root -p'$MYSQL_ROOT_PASSWORD' -e \"SHOW SLAVE STATUS\\G\""
print_info ""
print_info "To monitor replication lag:"
print_info "  docker exec caraban-mariadb-slave mysql -u root -p'$MYSQL_ROOT_PASSWORD' -e \"SHOW SLAVE STATUS\\G\" | grep Seconds_Behind_Master"
print_info ""
