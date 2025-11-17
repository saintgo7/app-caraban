#!/bin/bash

# AWS EC2 Server Setup Script for Caraban Camping Platform
# Run this script on a fresh Ubuntu 22.04 EC2 instance

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "\n${BLUE}==>${NC} $1\n"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    print_info "Run as: ./setup-server.sh"
    exit 1
fi

print_step "🚀 Caraban Server Setup - Starting..."

# Update system
print_step "📦 Updating system packages..."
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# Install essential packages
print_step "📦 Installing essential packages..."
sudo apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw

print_info "✓ Essential packages installed"

# Install Docker
print_step "🐳 Installing Docker..."
if command -v docker &> /dev/null; then
    print_warning "Docker is already installed"
else
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Set up Docker repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add user to docker group
    sudo usermod -aG docker $USER

    print_info "✓ Docker installed successfully"
    print_warning "⚠️  Please log out and back in for Docker group changes to take effect"
fi

# Verify Docker installation
print_step "🔍 Verifying Docker installation..."
sudo docker --version
sudo docker compose version

# Configure Docker daemon
print_step "⚙️  Configuring Docker daemon..."
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

sudo systemctl restart docker
print_info "✓ Docker daemon configured"

# Setup firewall
print_step "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw status
print_info "✓ Firewall configured"

# Create application directory
print_step "📁 Creating application directories..."
sudo mkdir -p /var/www/caraban
sudo mkdir -p /var/backups
sudo mkdir -p /var/log/caraban
sudo chown -R $USER:$USER /var/www/caraban
sudo chown -R $USER:$USER /var/backups
sudo chown -R $USER:$USER /var/log/caraban
print_info "✓ Application directories created"

# Install Nginx (for reverse proxy and SSL termination)
print_step "🌐 Installing Nginx..."
if command -v nginx &> /dev/null; then
    print_warning "Nginx is already installed"
else
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    print_info "✓ Nginx installed"
fi

# Create Nginx configuration for Caraban
print_step "⚙️  Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/caraban > /dev/null <<'EOF'
# Caraban Camping Platform - Nginx Configuration
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name _;

    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server (uncomment after SSL certificates are obtained)
# server {
#     listen 443 ssl http2;
#     server_name caraban.com www.caraban.com;
#
#     # SSL certificates (update with your domain)
#     ssl_certificate /etc/letsencrypt/live/caraban.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/caraban.com/privkey.pem;
#
#     # SSL configuration
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
#     ssl_session_cache shared:SSL:10m;
#     ssl_session_timeout 10m;
#
#     # Security headers
#     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
#     add_header X-Frame-Options "SAMEORIGIN" always;
#     add_header X-Content-Type-Options "nosniff" always;
#     add_header X-XSS-Protection "1; mode=block" always;
#
#     # Frontend (React app)
#     location / {
#         proxy_pass http://localhost:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_cache_bypass $http_upgrade;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#     }
#
#     # Backend API
#     location /api {
#         proxy_pass http://localhost:5000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_cache_bypass $http_upgrade;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#
#         # Increase timeout for long-running requests
#         proxy_connect_timeout 60s;
#         proxy_send_timeout 60s;
#         proxy_read_timeout 60s;
#     }
#
#     # Static files and uploads
#     location /uploads {
#         proxy_pass http://localhost:5000;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#
#         # Cache static files
#         expires 1y;
#         add_header Cache-Control "public, immutable";
#     }
#
#     # Gzip compression
#     gzip on;
#     gzip_vary on;
#     gzip_proxied any;
#     gzip_comp_level 6;
#     gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
# }
EOF

# Enable Nginx site (but don't activate HTTPS yet)
sudo ln -sf /etc/nginx/sites-available/caraban /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
print_info "✓ Nginx configuration created"

# Install Certbot for SSL certificates
print_step "🔒 Installing Certbot for SSL certificates..."
if command -v certbot &> /dev/null; then
    print_warning "Certbot is already installed"
else
    sudo snap install --classic certbot
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
    print_info "✓ Certbot installed"
fi

# Setup log rotation
print_step "📊 Setting up log rotation..."
sudo tee /etc/logrotate.d/caraban > /dev/null <<'EOF'
/var/log/caraban/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
EOF
print_info "✓ Log rotation configured"

# Setup cron for database backups
print_step "⏰ Setting up automated database backups..."
CRON_JOB="0 2 * * * cd /var/www/caraban/current && docker compose -f docker-compose.prod.yml exec -T mariadb sh /backup.sh >> /var/log/caraban/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v '/backup.sh'; echo "$CRON_JOB") | crontab -
print_info "✓ Daily backup cron job created (runs at 2 AM)"

# Install monitoring tools
print_step "📊 Installing monitoring tools..."
sudo apt-get install -y \
    netdata \
    fail2ban

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
print_info "✓ Monitoring tools installed"

# System optimizations
print_step "⚡ Applying system optimizations..."
sudo tee -a /etc/sysctl.conf > /dev/null <<'EOF'

# Caraban optimizations
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 2048
vm.swappiness = 10
fs.file-max = 65535
EOF
sudo sysctl -p
print_info "✓ System optimizations applied"

# Create deployment helper script
print_step "📝 Creating deployment helper scripts..."
cat > /home/$USER/deploy.sh <<'EOF'
#!/bin/bash
# Quick deployment helper
cd /var/www/caraban/current
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --no-deps
docker compose -f docker-compose.prod.yml ps
EOF
chmod +x /home/$USER/deploy.sh

cat > /home/$USER/logs.sh <<'EOF'
#!/bin/bash
# Quick logs viewer
cd /var/www/caraban/current
docker compose -f docker-compose.prod.yml logs -f --tail=100
EOF
chmod +x /home/$USER/logs.sh

cat > /home/$USER/status.sh <<'EOF'
#!/bin/bash
# Quick status checker
cd /var/www/caraban/current
echo "=== Docker Containers ==="
docker compose -f docker-compose.prod.yml ps
echo ""
echo "=== Disk Usage ==="
df -h
echo ""
echo "=== Memory Usage ==="
free -h
echo ""
echo "=== Docker Stats ==="
docker stats --no-stream
EOF
chmod +x /home/$USER/status.sh

print_info "✓ Helper scripts created: ~/deploy.sh, ~/logs.sh, ~/status.sh"

# Print summary
print_step "✅ Server setup completed successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Server is ready for Caraban deployment!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🔐 Obtain SSL certificates (after DNS is configured):"
echo "   sudo certbot --nginx -d your-domain.com -d www.your-domain.com"
echo ""
echo "2. 📝 Update Nginx configuration:"
echo "   sudo vim /etc/nginx/sites-available/caraban"
echo "   # Uncomment the HTTPS server block and update domain"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "3. 🚀 Deploy the application:"
echo "   From your local machine, run:"
echo "   export DEPLOY_HOST=<this-server-ip>"
echo "   ./scripts/deploy-aws.sh staging"
echo ""
echo "4. 📊 Monitor your application:"
echo "   ./status.sh  - Check container status"
echo "   ./logs.sh    - View application logs"
echo "   ./deploy.sh  - Quick redeploy"
echo ""
echo "5. 🔒 Configure GitHub Secrets for CI/CD:"
echo "   DOCKER_USERNAME, DOCKER_PASSWORD"
echo "   STAGING_HOST, STAGING_USER, STAGING_SSH_KEY"
echo "   PRODUCTION_HOST, PRODUCTION_USER, PRODUCTION_SSH_KEY"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_warning "⚠️  IMPORTANT: Please log out and back in for Docker group changes to take effect"
echo ""
echo "📚 For more information, see: DEPLOYMENT.md"
echo ""
