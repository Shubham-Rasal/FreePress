#!/bin/bash
# Test script for WordPress IPFS Mirroring
# This script helps verify the mirroring functionality

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  FreePress - WordPress IPFS Mirroring Test Script     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
WORDPRESS_URL="http://localhost:8080"
PUBLISHER_AGENT_URL="http://localhost:3001"
IPFS_GATEWAY="http://localhost:8081"

# Helper functions
check_service() {
    local service_name=$1
    local url=$2
    
    echo -n "Checking $service_name... "
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not responding${NC}"
        return 1
    fi
}

# 1. Check if services are running
echo "📋 Step 1: Checking services"
echo "─────────────────────────────"

check_service "WordPress" "$WORDPRESS_URL"
wordpress_status=$?

check_service "Publisher Agent" "$PUBLISHER_AGENT_URL/api/health"
agent_status=$?

check_service "IPFS Gateway" "$IPFS_GATEWAY/api/v0/version"
ipfs_status=$?

echo ""

if [ $wordpress_status -ne 0 ] || [ $agent_status -ne 0 ] || [ $ipfs_status -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Some services are not running. Please start them with:${NC}"
    echo "   docker compose up -d"
    echo ""
    exit 1
fi

# 2. Check WordPress has content
echo "📄 Step 2: Checking WordPress content"
echo "─────────────────────────────────────"

if curl -s "$WORDPRESS_URL" | grep -q "WordPress"; then
    echo -e "${GREEN}✓ WordPress is serving content${NC}"
else
    echo -e "${YELLOW}⚠️  WordPress may not be fully initialized${NC}"
    echo "   Please ensure WordPress is set up at $WORDPRESS_URL"
fi
echo ""

# 3. Get publisher agent status
echo "🔍 Step 3: Publisher Agent Status"
echo "──────────────────────────────────"

health_response=$(curl -s "$PUBLISHER_AGENT_URL/api/health")
echo "$health_response" | jq . 2>/dev/null || echo "$health_response"
echo ""

# 4. Trigger manual mirror
echo "🔄 Step 4: Triggering manual mirror"
echo "────────────────────────────────────"

echo "This will export WordPress and upload to IPFS..."
echo "This may take 30-60 seconds depending on site size."
echo ""

mirror_response=$(curl -s -X POST "$PUBLISHER_AGENT_URL/api/mirror")

if echo "$mirror_response" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Mirror operation successful!${NC}"
    echo ""
    
    # Extract CID
    cid=$(echo "$mirror_response" | jq -r '.cid')
    size=$(echo "$mirror_response" | jq -r '.size')
    
    echo "Mirror Details:"
    echo "───────────────"
    echo "CID:  $cid"
    echo "Size: $size bytes"
    echo ""
    
    # 5. Verify IPFS content
    echo "🔍 Step 5: Verifying IPFS content"
    echo "──────────────────────────────────"
    
    gateway_url="$IPFS_GATEWAY/ipfs/$cid/"
    echo "Checking: $gateway_url"
    
    if curl -s -f "$gateway_url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Content is accessible via IPFS!${NC}"
        echo ""
        
        echo "Access URLs:"
        echo "────────────"
        echo "Local Gateway:  $gateway_url"
        echo "Public IPFS:    https://ipfs.io/ipfs/$cid/"
        echo "Pinata Gateway: https://gateway.pinata.cloud/ipfs/$cid/"
        echo "Cloudflare:     https://cloudflare-ipfs.com/ipfs/$cid/"
        echo ""
        
    else
        echo -e "${YELLOW}⚠️  Content not yet propagated to IPFS gateway${NC}"
        echo "   Wait a few seconds and try accessing: $gateway_url"
        echo ""
    fi
    
    # 6. Check multi-page support
    echo "📑 Step 6: Testing multi-page support"
    echo "──────────────────────────────────────"
    
    # Check if index.html exists
    if curl -s -f "$gateway_url/index.html" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Home page (index.html) found${NC}"
    else
        echo -e "${YELLOW}⚠️  index.html not found${NC}"
    fi
    
    # Check for common WordPress paths
    for path in "wp-content/" "wp-includes/" "wp-json/"; do
        if curl -s -f "$gateway_url$path" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ WordPress directory found: $path${NC}"
        fi
    done
    
    echo ""
    
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║              ✅ Test Completed Successfully            ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo "───────────"
    echo "1. Open the IPFS gateway URL in your browser"
    echo "2. Navigate through pages to verify all links work"
    echo "3. Check that images and CSS are loading correctly"
    echo "4. View publisher-agent logs: docker compose logs -f publisher-agent"
    echo ""
    
else
    echo -e "${RED}✗ Mirror operation failed${NC}"
    echo ""
    echo "Error response:"
    echo "$mirror_response" | jq . 2>/dev/null || echo "$mirror_response"
    echo ""
    echo "Troubleshooting:"
    echo "────────────────"
    echo "1. Check publisher-agent logs: docker compose logs publisher-agent"
    echo "2. Verify WordPress is accessible: curl $WORDPRESS_URL"
    echo "3. Check IPFS is running: curl $IPFS_GATEWAY/api/v0/version"
    echo ""
    exit 1
fi
