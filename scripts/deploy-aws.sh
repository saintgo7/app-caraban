#!/bin/bash

# AWS EC2 Deployment Script for Caraban Camping Platform
# This script automates the deployment process to AWS EC2

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-staging}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_HOST="${DEPLOY_HOST}"
APP_DIR="/var/www/caraban"

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [staging|production]"
    exit 1
fi

# Check required variables
if [ -z "$DEPLOY_HOST" ]; then
    print_error "DEPLOY_HOST environment variable is not set"
    echo "Example: export DEPLOY_HOST=ec2-xx-xx-xx-xx.compute.amazonaws.com"
    exit 1
fi

print_info "Deploying to $ENVIRONMENT environment..."
print_info "Target host: $DEPLOY_USER@$DEPLOY_HOST"

# Confirm deployment for production
if [ "$ENVIRONMENT" == "production" ]; then
    print_warning "⚠️  You are about to deploy to PRODUCTION"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        print_info "Deployment cancelled"
        exit 0
    fi
fi

# Check SSH connection
print_info "Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$DEPLOY_USER@$DEPLOY_HOST" exit 2>/dev/null; then
    print_error "Cannot connect to $DEPLOY_HOST via SSH"
    print_info "Please ensure:"
    print_info "  1. SSH key is added to ssh-agent: ssh-add ~/.ssh/your-key.pem"
    print_info "  2. Security group allows SSH from your IP"
    exit 1
fi
print_info "✓ SSH connection successful"

# Create deployment package
print_info "Creating deployment package..."
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Copy necessary files
cp "$PROJECT_ROOT/docker-compose.prod.yml" "$TEMP_DIR/"
cp "$PROJECT_ROOT/.env.$ENVIRONMENT" "$TEMP_DIR/.env"
cp "$PROJECT_ROOT/scripts/backup.sh" "$TEMP_DIR/"

# Create deployment archive
cd "$TEMP_DIR"
tar -czf deploy.tar.gz *
print_info "✓ Deployment package created"

# Upload deployment package
print_info "Uploading deployment package to server..."
scp "$TEMP_DIR/deploy.tar.gz" "$DEPLOY_USER@$DEPLOY_HOST:/tmp/"
print_info "✓ Upload complete"

# Deploy on remote server
print_info "Executing deployment on remote server..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" bash << EOF
set -e

# Colors for remote output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\${GREEN}[REMOTE]${NC} Setting up deployment directory..."

# Create app directory if it doesn't exist
sudo mkdir -p $APP_DIR
sudo chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR
cd $APP_DIR

# Backup current deployment
if [ -d "current" ]; then
    echo -e "\${GREEN}[REMOTE]${NC} Backing up current deployment..."
    sudo cp -r current "backup_\$(date +%Y%m%d_%H%M%S)" || true
fi

# Extract new deployment
echo -e "\${GREEN}[REMOTE]${NC} Extracting deployment package..."
rm -rf new_deploy
mkdir -p new_deploy
cd new_deploy
tar -xzf /tmp/deploy.tar.gz
rm /tmp/deploy.tar.gz

# Backup database (production only)
if [ "$ENVIRONMENT" == "production" ] && [ -d "../current" ]; then
    echo -e "\${GREEN}[REMOTE]${NC} Creating database backup..."
    cd ../current
    if docker compose -f docker-compose.prod.yml ps | grep -q mariadb; then
        docker compose -f docker-compose.prod.yml exec -T mariadb \
            mysqldump -u caraban -p\$DB_PASSWORD caraban_$ENVIRONMENT \
            | gzip > /var/backups/pre_deploy_\$(date +%Y%m%d_%H%M%S).sql.gz || true
    fi
    cd ../new_deploy
fi

# Pull latest Docker images
echo -e "\${GREEN}[REMOTE]${NC} Pulling latest Docker images..."
docker compose -f docker-compose.prod.yml pull

# Stop old containers gracefully
if [ -d "../current" ]; then
    echo -e "\${GREEN}[REMOTE]${NC} Stopping old containers..."
    cd ../current
    docker compose -f docker-compose.prod.yml down --timeout 30 || true
    cd ../new_deploy
fi

# Start new containers
echo -e "\${GREEN}[REMOTE]${NC} Starting new containers..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo -e "\${GREEN}[REMOTE]${NC} Waiting for services to start..."
sleep 15

# Health check
echo -e "\${GREEN}[REMOTE]${NC} Running health checks..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "\${GREEN}[REMOTE]${NC} ✓ Backend health check passed"
else
    echo -e "\${YELLOW}[REMOTE]${NC} ⚠ Backend health check failed!"
    exit 1
fi

if curl -f http://localhost/ > /dev/null 2>&1; then
    echo -e "\${GREEN}[REMOTE]${NC} ✓ Frontend health check passed"
else
    echo -e "\${YELLOW}[REMOTE]${NC} ⚠ Frontend health check failed!"
    exit 1
fi

# Update current symlink
cd ..
rm -rf current
mv new_deploy current

# Clean up old backups (keep last 5)
ls -t backup_* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true

# Clean up Docker
echo -e "\${GREEN}[REMOTE]${NC} Cleaning up old Docker images..."
docker image prune -af --filter "until=24h"

echo -e "\${GREEN}[REMOTE]${NC} ✅ Deployment completed successfully!"

EOF

if [ $? -eq 0 ]; then
    print_info "🚀 Deployment to $ENVIRONMENT completed successfully!"
    print_info ""
    print_info "Next steps:"
    print_info "  1. Verify application: https://$DEPLOY_HOST"
    print_info "  2. Check logs: ssh $DEPLOY_USER@$DEPLOY_HOST 'cd $APP_DIR/current && docker compose -f docker-compose.prod.yml logs -f'"
    print_info "  3. Monitor status: ssh $DEPLOY_USER@$DEPLOY_HOST 'cd $APP_DIR/current && docker compose -f docker-compose.prod.yml ps'"
else
    print_error "Deployment failed!"
    print_info "To rollback, run: ssh $DEPLOY_USER@$DEPLOY_HOST 'cd $APP_DIR && rm -rf current && mv backup_* current'"
    exit 1
fi
