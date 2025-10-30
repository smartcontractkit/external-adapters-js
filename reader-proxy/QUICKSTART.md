# Quick Start Guide

Get the reader-proxy up and running in minutes!

## Option 1: Docker Compose (Recommended for Testing)

The fastest way to test the proxy with a sample downstream service:

```bash
# Start both the proxy and a test downstream service (httpbin)
docker-compose up

# In another terminal, run the test script
./test_proxy.sh
```

This will:

- Start the reader-proxy on port 8080
- Start httpbin (test service) on port 8081
- Allow you to test the proxy immediately

## Option 2: Run Locally

### Prerequisites

- Go 1.21 or later

### Steps

```bash
# 1. Install dependencies
go mod download

# 2. Run the service (pointing to your downstream service)
export DOWNSTREAM_URL=http://localhost:8081
export CACHE_TTL=30s
go run .
```

Or use the Makefile:

```bash
make run
```

## Option 3: Build and Run Binary

```bash
# Build
make build

# Configure and run
export DOWNSTREAM_URL=http://your-api.com
export CACHE_TTL=1m
./reader-proxy
```

## Option 4: Docker Only

```bash
# Build image
docker build -t reader-proxy:latest .

# Run container
docker run -p 8080:8080 \
  -e DOWNSTREAM_URL=http://your-service:8081 \
  -e CACHE_TTL=30s \
  reader-proxy:latest
```

## Testing the Proxy

### 1. Check health:

```bash
curl http://localhost:8080/health
```

### 2. Make a proxied request:

```bash
# First request (cache miss)
curl http://localhost:8080/get?test=1

# Second request (cache hit - should be faster)
curl -i http://localhost:8080/get?test=1
# Look for "X-Cache: HIT" header
```

### 3. View metrics:

```bash
curl http://localhost:8080/metrics
```

### 4. Test request coalescing:

```bash
# Send 10 concurrent identical requests
# Only 1 should reach the downstream service
for i in {1..10}; do
  curl http://localhost:8080/delay/2 &
done
wait

# Check metrics to see coalesced_requests
curl http://localhost:8080/metrics
```

## Common Configuration Examples

### High-frequency API with short TTL:

```bash
export DOWNSTREAM_URL=http://api.example.com
export CACHE_TTL=10s
export CACHE_CLEANUP_INTERVAL=30s
./reader-proxy
```

### Rate-limited API with longer cache:

```bash
export DOWNSTREAM_URL=http://rate-limited-api.com
export CACHE_TTL=5m
export CACHE_404=true
./reader-proxy
```

### Development with aggressive caching:

```bash
export DOWNSTREAM_URL=http://localhost:3000
export CACHE_TTL=10m
./reader-proxy
```

## Monitoring

Watch metrics in real-time:

```bash
watch -n 1 'curl -s http://localhost:8080/metrics | jq'
```

Key metrics to monitor:

- **cache_hit_rate**: Higher is better (50%+ is good)
- **coalesced_requests**: Shows how many duplicate requests were prevented
- **cache_size**: Monitor to ensure memory usage is reasonable

## Troubleshooting

### "connection refused" errors

- Ensure DOWNSTREAM_URL is accessible from the proxy
- If using Docker, use `host.docker.internal` for localhost services
- Check network connectivity

### Low cache hit rate

- Increase CACHE_TTL
- Check if requests have varying headers/bodies
- Use CACHE_KEY_HEADERS to exclude irrelevant headers

### High memory usage

- Decrease CACHE_TTL
- Decrease CACHE_CLEANUP_INTERVAL
- Monitor unique request patterns

## Next Steps

1. Integrate with your production service
2. Monitor metrics and tune CACHE_TTL
3. Set up health check monitoring
4. Configure appropriate timeouts for your use case

For detailed documentation, see [README.md](README.md)
