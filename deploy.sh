#!/bin/bash
# =====================================================
# PEERZEE VPS DEPLOYMENT SCRIPT
# Run this script on VPS to set up everything from scratch
# =====================================================

set -e

echo "=========================================="
echo "PEERZEE VPS DEPLOYMENT"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="peerzee.centralindia.cloudapp.azure.com"
PROJECT_DIR="$HOME/Projects/peerzee-fullstack"

# =====================================================
# STEP 1: Stop existing services
# =====================================================
echo -e "${YELLOW}[1/7] Stopping existing services...${NC}"
cd "$PROJECT_DIR" 2>/dev/null || { echo "Project dir not found!"; exit 1; }

sudo docker compose -f docker-compose.prod.yml down 2>/dev/null || true
sudo docker compose down 2>/dev/null || true

echo -e "${GREEN}✓ Services stopped${NC}"

# =====================================================
# STEP 2: Clean up old Docker images
# =====================================================
echo -e "${YELLOW}[2/7] Cleaning old Docker images...${NC}"

sudo docker rmi peerzee-fullstack-frontend 2>/dev/null || true
sudo docker rmi peerzee-fullstack-backend 2>/dev/null || true
sudo docker system prune -f 2>/dev/null || true

echo -e "${GREEN}✓ Docker cleaned${NC}"

# =====================================================
# STEP 3: Pull latest code
# =====================================================
echo -e "${YELLOW}[3/7] Pulling latest code...${NC}"

git fetch origin
git reset --hard origin/main

echo -e "${GREEN}✓ Code updated${NC}"

# =====================================================
# STEP 4: Configure Nginx
# =====================================================
echo -e "${YELLOW}[4/7] Configuring Nginx...${NC}"

sudo tee /etc/nginx/sites-available/peerzee.conf > /dev/null << 'NGINX_EOF'
upstream frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream backend {
    server 127.0.0.1:9000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name peerzee.centralindia.cloudapp.azure.com;

    ssl_certificate /etc/letsencrypt/live/peerzee.centralindia.cloudapp.azure.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/peerzee.centralindia.cloudapp.azure.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # WebSocket - /socket/*
    location /socket/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # REST API - /api/*
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }

    # File uploads
    location /uploads/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        client_max_body_size 50M;
    }

    # Swagger docs
    location /swagger {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Frontend (default)
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name peerzee.centralindia.cloudapp.azure.com;
    return 301 https://$host$request_uri;
}
NGINX_EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/peerzee.conf /etc/nginx/sites-enabled/peerzee.conf
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t
sudo systemctl restart nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

# =====================================================
# STEP 5: Verify Nginx is listening
# =====================================================
echo -e "${YELLOW}[5/7] Verifying Nginx ports...${NC}"

sleep 2
PORTS=$(sudo ss -tlnp | grep -E ":(80|443)" | wc -l)
if [ "$PORTS" -ge 2 ]; then
    echo -e "${GREEN}✓ Nginx listening on ports 80 and 443${NC}"
else
    echo -e "${RED}✗ Nginx not listening properly!${NC}"
    sudo ss -tlnp | grep nginx
    echo "Check SSL certificates exist:"
    sudo ls -la /etc/letsencrypt/live/$DOMAIN/ 2>/dev/null || echo "SSL certs not found!"
fi

# =====================================================
# STEP 6: Build and start Docker containers
# =====================================================
echo -e "${YELLOW}[6/7] Building and starting Docker containers...${NC}"

cd "$PROJECT_DIR"

# Build and start
sudo docker compose -f docker-compose.prod.yml up -d --build

# Wait for containers to start
echo "Waiting for containers to start..."
sleep 10

echo -e "${GREEN}✓ Docker containers started${NC}"

# =====================================================
# STEP 7: Verify everything is running
# =====================================================
echo -e "${YELLOW}[7/7] Verifying deployment...${NC}"

echo ""
echo "=== Docker Containers ==="
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Testing Backend ==="
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9000/api/user/login -X POST -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "FAILED")
echo "Backend API status: $BACKEND_STATUS"

echo ""
echo "=== Testing Frontend ==="
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 2>/dev/null || echo "FAILED")
echo "Frontend status: $FRONTEND_STATUS"

echo ""
echo "=== Nginx Ports ==="
sudo ss -tlnp | grep -E ":(80|443)"

echo ""
echo "=========================================="
echo -e "${GREEN}DEPLOYMENT COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "Access your site at: https://$DOMAIN"
echo ""
echo "If issues persist, check logs:"
echo "  - Backend:  sudo docker logs peerzee-backend --tail=50"
echo "  - Frontend: sudo docker logs peerzee-frontend --tail=50"
echo "  - Nginx:    sudo tail -50 /var/log/nginx/error.log"
echo ""
