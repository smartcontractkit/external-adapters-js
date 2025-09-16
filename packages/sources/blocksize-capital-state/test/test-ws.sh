#!/bin/bash

BASE_URL="http://localhost:3030"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper function to make a request with retry
make_request() {
    local base=$1
    local quote=$2
    curl -s -X POST $BASE_URL \
        -H "Content-Type: application/json" \
        -d "{\"data\":{\"endpoint\":\"state\",\"base\":\"$base\",\"quote\":\"$quote\"}}" \
        2>/dev/null
}

# Helper function to make request with retries and backoff
make_request_with_retry() {
    local base=$1
    local quote=$2
    local max_retries=$3
    local retry_count=0

    while [ $retry_count -lt $max_retries ]; do
        response=$(make_request "$base" "$quote")

        # Check if we got data (not "no data yet" error)
        if echo "$response" | grep -q "\"result\":"; then
            echo "$response"
            return 0
        elif echo "$response" | grep -q "The EA has not received any values"; then
            ((retry_count++))
            if [ $retry_count -lt $max_retries ]; then
                local wait_time=$((retry_count * 2))  # Exponential backoff: 2, 4, 6 seconds
                sleep $wait_time
            fi
        else
            # Other errors (validation, etc.) shouldn't retry
            echo "$response"
            return 1
        fi
    done

    # Return last response if all retries failed
    echo "$response"
    return 1
}

# Helper to check if request succeeded
check_response() {
    local response=$1
    if echo "$response" | grep -q "\"status\":\"errored\""; then
        echo -e "${RED}✗ Error${NC}"
        echo "$response" | grep -o '"message":"[^"]*"' | head -1
        return 1
    elif echo "$response" | grep -q "\"result\":"; then
        local price=$(echo "$response" | grep -o '"result":[0-9.]*' | cut -d: -f2)
        echo -e "${GREEN}✓ Success${NC} - Price: $price"
        return 0
    else
        echo -e "${YELLOW}? Unknown response${NC}"
        echo "$response" | head -1
        return 1
    fi
}

echo "========================================="
echo "WebSocket Test Suite"
echo "========================================="
echo ""
echo -e "${YELLOW}Waiting 5 seconds for adapter to establish WebSocket connections...${NC}"
sleep 5
echo "Starting tests..."
echo ""

# Test 1: Single Subscription
echo -e "${YELLOW}Test 1: Single Subscription${NC}"
echo "Testing CBBTC/USD (with retries)..."
response=$(make_request_with_retry "CBBTC" "USD" 3)
check_response "$response"
echo ""

# Test 2: Multiple Different Subscriptions
echo -e "${YELLOW}Test 2: Multiple Different Subscriptions${NC}"
echo "Subscribing to multiple pairs (with retries)..."

echo -n "CBBTC/USD: "
response=$(make_request_with_retry "CBBTC" "USD" 3)
check_response "$response"

echo -n "CBBTC/ETH: "
response=$(make_request_with_retry "CBBTC" "ETH" 3)
check_response "$response"

echo -n "ALETH/USD: "
response=$(make_request_with_retry "ALETH" "USD" 3)
check_response "$response"

echo -n "ALETH/ETH: "
response=$(make_request_with_retry "ALETH" "ETH" 3)
check_response "$response"

echo -n "CBETH/USD: "
response=$(make_request_with_retry "CBETH" "USD" 3)
check_response "$response"

echo -n "CBETH/ETH: "
response=$(make_request_with_retry "CBETH" "ETH" 3)
check_response "$response"

sleep 2
echo ""

# Test 3: Duplicate Subscription (should use cached)
echo -e "${YELLOW}Test 3: Duplicate Subscription Handling${NC}"
echo "Requesting same pair multiple times (should use existing subscription)..."
for i in {1..3}; do
    echo -n "Request $i - CBBTC/USD: "
    response=$(make_request "CBBTC" "USD")
    check_response "$response"
done
echo ""

# Test 4: Invalid Ticker Handling
echo -e "${YELLOW}Test 4: Invalid Ticker Handling${NC}"
echo "Testing invalid tickers (should timeout with 'no data yet' after retries)..."

test_invalid_ticker() {
    local base=$1
    local quote=$2
    echo -n "Testing invalid ticker $base/$quote: "

    # Wait longer for invalid tickers - they should consistently fail
    sleep 5
    response=$(make_request_with_retry "$base" "$quote" 2)  # Only 2 retries for invalid tickers

    if echo "$response" | grep -q "The EA has not received any values"; then
        echo -e "${GREEN}✓ Correctly no data (invalid ticker)${NC}"
    elif echo "$response" | grep -q "\"result\":"; then
        echo -e "${RED}✗ Unexpected success${NC} - got data for invalid ticker"
        local price=$(echo "$response" | grep -o '"result":[0-9.]*' | cut -d: -f2)
        echo "Price: $price"
    else
        echo -e "${YELLOW}? Other error${NC}"
        echo "$response" | grep -o '"message":"[^"]*"' | head -1
    fi
}

test_invalid_ticker "INVALID" "USD"
test_invalid_ticker "LINK" "ETH"
test_invalid_ticker "ALBTC" "USD"
echo ""

# Test 5: Multiple Simultaneous Subscriptions (Background Parallel Requests)
echo -e "${YELLOW}Test 5: Multiple Simultaneous Subscriptions${NC}"
echo "Subscribing to all pairs simultaneously (including invalid tickers)..."

# Arrays for valid and invalid pairs
valid_pairs=("CBBTC/USD" "CBBTC/ETH" "ALETH/USD" "ALETH/ETH" "CBETH/USD" "CBETH/ETH")
invalid_pairs=("ALBTC/USD" "LINK/ETH" "BTC/USD")
all_pairs=("${valid_pairs[@]}" "${invalid_pairs[@]}")

# Start all requests in parallel using background processes
pids=()
temp_files=()

for pair in "${all_pairs[@]}"; do
    IFS='/' read -r base quote <<< "$pair"
    temp_file="/tmp/test_${base}_${quote}_$$"
    temp_files+=("$temp_file")

    # Start background request
    (make_request_with_retry "$base" "$quote" 2 > "$temp_file" 2>&1) &
    pids+=($!)
done

echo "Waiting for all ${#all_pairs[@]} requests to complete..."
# Wait for all background processes
for pid in "${pids[@]}"; do
    wait "$pid"
done

echo "Results:"
# Process results
for i in "${!all_pairs[@]}"; do
    pair="${all_pairs[$i]}"
    temp_file="${temp_files[$i]}"
    response=$(cat "$temp_file" 2>/dev/null)

    echo -n "  $pair: "
    if echo "$response" | grep -q "\"result\":"; then
        price=$(echo "$response" | grep -o '"result":[0-9.]*' | cut -d: -f2)
        echo -e "${GREEN}✓ Price: $price${NC}"
    elif echo "$response" | grep -q "The EA has not received any values"; then
        # Check if this is an invalid pair (expected to fail)
        is_invalid=false
        for invalid in "${invalid_pairs[@]}"; do
            if [ "$pair" = "$invalid" ]; then
                is_invalid=true
                break
            fi
        done

        if [ "$is_invalid" = true ]; then
            echo -e "${GREEN}✓ No data (expected for invalid ticker)${NC}"
        else
            echo -e "${RED}✗ No data (unexpected for valid ticker)${NC}"
        fi
    else
        echo -e "${YELLOW}? Other response${NC}"
    fi

    # Clean up temp file
    rm -f "$temp_file"
done
echo ""

# Test 6: Invalid quote currency (only USD and ETH are supported)
echo -e "${YELLOW}Test 6: Invalid quote currency validation${NC}"
echo "Testing invalid quote currencies (should get validation errors)..."

test_invalid_quote() {
    local base=$1
    local quote=$2
    echo -n "Testing $base/$quote: "

    response=$(make_request "$base" "$quote")

    if echo "$response" | grep -q "input is not one of valid options"; then
        echo -e "${GREEN}✓ Correctly rejected (invalid quote)${NC}"
    elif echo "$response" | grep -q "\"result\":"; then
        echo -e "${RED}✗ Unexpected success${NC} - got data for invalid quote"
        local price=$(echo "$response" | grep -o '"result":[0-9.]*' | cut -d: -f2)
        echo "Price: $price"
    else
        echo -e "${YELLOW}? Other error${NC}"
        echo "$response" | grep -o '"message":"[^"]*"' | head -1
    fi
}

test_invalid_quote "CBBTC" "EUR"
test_invalid_quote "CBBTC" "BTC"
test_invalid_quote "CBBTC" "USDT"
echo ""


# Test 7: Subscription Persistence
echo -e "${YELLOW}Test 7: Subscription Persistence${NC}"
echo "Waiting 5 seconds, then checking if subscriptions still active..."
sleep 5

echo -n "CBBTC/USD (should still work): "
response=$(make_request "CBBTC" "USD")
check_response "$response"

echo -n "ALETH/USD (should still work): "
response=$(make_request "ALETH" "USD")
check_response "$response"
echo ""

# Test 8: Concurrent Same Ticker Requests (Caching Test)
echo -e "${YELLOW}Test 8: Concurrent Same Ticker Requests${NC}"
echo "Making 10 concurrent CBBTC/USD requests (tests caching efficiency)..."

# Record start time
start_time=$(date +%s%3N)

# Start 10 concurrent requests for the same ticker
pids=()
temp_files=()
for i in {1..10}; do
    temp_file="/tmp/concurrent_${i}_$$"
    temp_files+=("$temp_file")
    (make_request "CBBTC" "USD" > "$temp_file" 2>&1) &
    pids+=($!)
done

# Wait for all to complete
for pid in "${pids[@]}"; do
    wait "$pid"
done

# Calculate duration
end_time=$(date +%s%3N)
duration=$((end_time - start_time))

# Analyze results
successful=0
failed=0
prices=()

for temp_file in "${temp_files[@]}"; do
    response=$(cat "$temp_file" 2>/dev/null)
    if echo "$response" | grep -q "\"result\":"; then
        ((successful++))
        price=$(echo "$response" | grep -o '"result":[0-9.]*' | cut -d: -f2)
        prices+=("$price")
        echo -n "✓"
    else
        ((failed++))
        echo -n "✗"
    fi
    rm -f "$temp_file"
done

# Count unique prices
if [ ${#prices[@]} -gt 0 ]; then
    unique_prices=($(printf '%s\n' "${prices[@]}" | sort -u))
    unique_count=${#unique_prices[@]}
else
    unique_count=0
fi

echo ""
echo "  Duration: ${duration}ms"
echo "  Successful: $successful/10"
echo "  Failed: $failed/10"
echo "  Unique prices: $unique_count (should be 1 if properly cached)"
if [ $unique_count -eq 1 ] && [ $successful -gt 0 ]; then
    echo -e "  ${GREEN}✓ Caching working correctly${NC}"
elif [ $successful -eq 0 ]; then
    echo -e "  ${YELLOW}⚠ No successful responses to analyze caching${NC}"
else
    echo -e "  ${YELLOW}⚠ Multiple unique prices - may indicate cache issues${NC}"
fi
echo ""

# Test 9: Load Test (Mixed Tickers)
echo -e "${YELLOW}Test 9: Load Test (20 rapid requests)${NC}"
echo "Making 20 requests as fast as possible (alternating tickers)..."
success_count=0
fail_count=0

for i in {1..20}; do
    # Alternate between different pairs
    if [ $((i % 2)) -eq 0 ]; then
        response=$(make_request "CBBTC" "USD")
    else
        response=$(make_request "ALETH" "USD")
    fi

    if echo "$response" | grep -q "\"result\":"; then
        ((success_count++))
        echo -n "✓"
    else
        ((fail_count++))
        echo -n "✗"
    fi
done
echo ""
echo "Results: $success_count successful, $fail_count failed"
echo ""

# Test 10: Connection Stability
echo -e "${YELLOW}Test 10: Connection Stability${NC}"
echo "Testing responses over 15 seconds (checking for consistency)..."
prices=()
for i in {1..5}; do
    response=$(make_request "CBBTC" "USD")
    price=$(echo "$response" | grep -o '"result":[0-9.]*' | cut -d: -f2)
    if [ ! -z "$price" ]; then
        prices+=("$price")
        echo "Check $i: Price = $price"
    fi
    sleep 3
done

# Check if prices are updating (should change over 15 seconds)
if [ ${#prices[@]} -gt 1 ]; then
    first_price=${prices[0]}
    # last_price=${prices[-1]}
    last_price=${prices[${#prices[@]}-1]}
    if [ "$first_price" != "$last_price" ]; then
        echo -e "${GREEN}✓ Prices are updating (WebSocket receiving data)${NC}"
    else
        echo -e "${YELLOW}⚠ Prices not changing (might be stale or market closed)${NC}"
    fi
fi
echo ""

echo "========================================="
echo "Test Suite Complete"
echo "========================================="