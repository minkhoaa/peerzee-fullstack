#!/bin/bash
# Diagnostic and fix script for VPS

echo "=== 1. NGINX STATUS ==="
sudo systemctl status nginx --no-pager | head -15

echo ""
echo "=== 2. NGINX LISTENING PORTS ==="
sudo ss -tlnp | grep nginx

echo ""
echo "=== 3. TEST NGINX CONFIG ==="
sudo nginx -t

echo ""
echo "=== 4. RESTART NGINX ==="
sudo systemctl restart nginx
sleep 2

echo ""
echo "=== 5. CHECK NGINX AFTER RESTART ==="
sudo ss -tlnp | grep -E ":(80|443)"

echo ""
echo "=== 6. DOCKER CONTAINERS ==="
sudo docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== 7. TEST LOCAL CONNECTIONS ==="
echo "Frontend (3000):"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "FAILED"
echo ""
echo "Backend (9000):"
curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/api/user/login || echo "FAILED"

echo ""
echo "=== 8. UFW FIREWALL ==="
sudo ufw status

echo ""
echo "=== DONE ==="
