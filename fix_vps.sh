#!/bin/bash
# Fix VPS script
set -e

SSH_CMD="ssh -i /home/khoa/Downloads/peerzee_key.pem -o StrictHostKeyChecking=no azureuser@4.240.102.170"

echo "=== Checking Docker containers ==="
$SSH_CMD 'sudo docker ps -a'

echo ""
echo "=== Backend logs (last 50 lines) ==="
$SSH_CMD 'sudo docker logs peerzee-backend --tail=50 2>&1' || echo "Container not found"

echo ""
echo "=== Frontend logs (last 30 lines) ==="
$SSH_CMD 'sudo docker logs peerzee-frontend --tail=30 2>&1' || echo "Container not found"

echo ""
echo "=== Test API locally on VPS ==="
$SSH_CMD 'curl -s http://localhost:9000/api/health 2>&1 || echo "Backend not responding"'

echo ""
echo "=== Check ports ==="
$SSH_CMD 'sudo ss -tlnp | grep -E ":(3000|9000|80|443)" || echo "No ports found"'
