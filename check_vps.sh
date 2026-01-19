#!/bin/bash
# Check VPS configuration and status

echo "=== BACKEND .ENV ==="
cat ~/peerzee-fullstack/peerzee-backend/.env 2>/dev/null || echo "File not found"

echo ""
echo "=== FRONTEND .ENV ==="
cat ~/peerzee-fullstack/peerzee-frontend/.env 2>/dev/null || echo "File not found"

echo ""
echo "=== ROOT .ENV (if exists) ==="
cat ~/peerzee-fullstack/.env 2>/dev/null || echo "No root .env file"

echo ""
echo "=== DOCKER CONTAINERS ==="
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== BACKEND LOGS (last 30 lines) ==="
docker logs peerzee-backend --tail=30 2>&1

echo ""
echo "=== FRONTEND LOGS (last 20 lines) ==="
docker logs peerzee-frontend --tail=20 2>&1

echo ""
echo "=== NGINX STATUS ==="
sudo systemctl status nginx --no-pager 2>/dev/null | head -10

echo ""
echo "=== CHECK PORTS ==="
sudo netstat -tlnp 2>/dev/null | grep -E ":(80|443|3000|9000)" || sudo ss -tlnp | grep -E ":(80|443|3000|9000)"
