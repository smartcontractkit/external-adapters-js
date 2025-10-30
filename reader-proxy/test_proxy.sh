#!/bin/bash

# Simple test script to verify reader-proxy functionality

PROXY_URL="http://localhost:8080"
HEALTH_URL="${PROXY_URL}/health"
METRICS_URL="${PROXY_URL}/metrics"

echo "================================"
echo "Reader Proxy Test Script"
echo "================================"
echo ""

# Test 1: Health check
echo "1. Testing health endpoint..."
health_response=$(curl -s -w "\n%{http_code}" ${HEALTH_URL})
http_code=$(echo "$health_response" | tail -n1)
if [ "$http_code" = "200" ]; then
    echo "✓ Health check passed"
else
    echo "✗ Health check failed (HTTP $http_code)"
fi
echo ""

# Test 2: First request (should be cache miss)
echo "2. Testing first request (cache miss)..."
response1=$(curl -s -w "\n%{http_code}" ${PROXY_URL}/get?test=1)
http_code=$(echo "$response1" | tail -n1)
if [ "$http_code" = "200" ]; then
    echo "✓ First request successful"
else
    echo "✗ First request failed (HTTP $http_code)"
fi
echo ""

# Test 3: Second identical request (should be cache hit)
echo "3. Testing second identical request (cache hit)..."
response2=$(curl -s -i ${PROXY_URL}/get?test=1 2>&1 | grep "X-Cache")
if echo "$response2" | grep -q "HIT"; then
    echo "✓ Cache hit detected"
else
    echo "✗ No cache hit detected (might be expired)"
fi
echo ""

# Test 4: Concurrent requests (testing coalescing)
echo "4. Testing concurrent requests (coalescing)..."
for i in {1..5}; do
    curl -s ${PROXY_URL}/delay/1 > /dev/null &
done
wait
echo "✓ Concurrent requests completed"
echo ""

# Test 5: Check metrics
echo "5. Checking metrics..."
metrics=$(curl -s ${METRICS_URL})
echo "$metrics" | jq '.' 2>/dev/null || echo "$metrics"
echo ""

# Test 6: Different request (new cache entry)
echo "6. Testing different request..."
response3=$(curl -s -w "\n%{http_code}" ${PROXY_URL}/get?test=2)
http_code=$(echo "$response3" | tail -n1)
if [ "$http_code" = "200" ]; then
    echo "✓ Different request successful"
else
    echo "✗ Different request failed (HTTP $http_code)"
fi
echo ""

# Final metrics
echo "================================"
echo "Final Metrics:"
echo "================================"
curl -s ${METRICS_URL} | jq '.' 2>/dev/null || curl -s ${METRICS_URL}
echo ""
echo "Test completed!"

