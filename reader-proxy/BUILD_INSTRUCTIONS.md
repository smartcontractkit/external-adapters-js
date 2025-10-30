# Building Adapters with Reader Proxy

This guide explains how to build adapter Docker images with the reader-proxy included.

## Overview

The `Dockerfile.with-proxy` at the root of the repository builds a multi-stage Docker image that includes:

1. **Go Reader Proxy** - Provides request coalescing and caching
2. **Node.js Adapter** - Your external adapter application

Both processes run together in the same container, managed by supervisord. External traffic hits the proxy on port 8080, which forwards to the Node.js adapter on port 8081.

## Architecture

```
External Request (port 8080)
         ↓
    Go Proxy (caching + coalescing)
         ↓
    Node.js Adapter (port 8081)
         ↓
    External Data Source
```

## Building an Adapter with Proxy

### Build Arguments

The Dockerfile requires the same build arguments as the original:

- `location`: Path to the adapter package (e.g., `packages/sources/coingecko`)
- `package`: Package name (e.g., `@chainlink/coingecko-adapter`)

### Example: Build CoinGecko Adapter with Proxy

```bash
docker build \
  -f Dockerfile.with-proxy \
  --build-arg location=packages/sources/coingecko \
  --build-arg package=@chainlink/coingecko-adapter \
  -t coingecko-adapter-with-proxy:latest \
  .
```

### Example: Build Composite Adapter with Proxy

```bash
docker build \
  -f Dockerfile.with-proxy \
  --build-arg location=packages/composites/proof-of-reserves \
  --build-arg package=@chainlink/por-adapter \
  -t por-adapter-with-proxy:latest \
  .
```

## Running the Container

### Basic Run

```bash
docker run -p 8080:8080 coingecko-adapter-with-proxy:latest
```

### With Custom Cache Configuration

```bash
docker run -p 8080:8080 \
  -e CACHE_TTL=60s \
  -e CACHE_CLEANUP_INTERVAL=120s \
  -e CACHE_404=true \
  -e DOWNSTREAM_TIMEOUT=45s \
  coingecko-adapter-with-proxy:latest
```

### With Adapter-Specific Environment Variables

```bash
docker run -p 8080:8080 \
  -e API_KEY=your-api-key \
  -e CACHE_TTL=30s \
  -e RATE_LIMIT_CAPACITY=100 \
  coingecko-adapter-with-proxy:latest
```

## Configuration

### Proxy Configuration (Optional)

These environment variables configure the reader-proxy:

| Variable                 | Description                    | Default |
| ------------------------ | ------------------------------ | ------- |
| `CACHE_TTL`              | Cache time-to-live             | `30s`   |
| `CACHE_CLEANUP_INTERVAL` | Cache cleanup frequency        | `60s`   |
| `DOWNSTREAM_TIMEOUT`     | Timeout for adapter requests   | `30s`   |
| `CACHE_404`              | Whether to cache 404 responses | `false` |

### Adapter Configuration

All standard adapter environment variables work as usual:

- `API_KEY`, `API_ENDPOINT`, etc. - Adapter-specific configuration
- `RATE_LIMIT_CAPACITY` - Rate limiting settings
- `LOG_LEVEL` - Logging configuration
- And any other adapter-specific variables

## Health Checks

The image includes a health check that verifies the proxy is responding:

```bash
# Check container health
docker ps

# Manual health check
curl http://localhost:8080/health
```

## Monitoring

### View Logs

```bash
# All logs (both proxy and adapter)
docker logs <container-id>

# Follow logs
docker logs -f <container-id>
```

### Check Proxy Metrics

```bash
curl http://localhost:8080/metrics
```

Response:

```json
{
  "total_requests": 1000,
  "cache_hits": 750,
  "cache_misses": 250,
  "cache_hit_rate": 75.0,
  "cache_size": 45,
  "coalesced_requests": 120
}
```

## Docker Compose Example

```yaml
version: '3.8'

services:
  coingecko-adapter:
    build:
      context: .
      dockerfile: Dockerfile.with-proxy
      args:
        location: packages/sources/coingecko
        package: '@chainlink/coingecko-adapter'
    ports:
      - '8080:8080'
    environment:
      # Proxy settings
      - CACHE_TTL=60s
      - CACHE_CLEANUP_INTERVAL=120s
      - CACHE_404=true

      # Adapter settings
      - API_KEY=${COINGECKO_API_KEY}
      - RATE_LIMIT_CAPACITY=100
    restart: unless-stopped
```

## Kubernetes Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: coingecko-adapter
spec:
  replicas: 3
  selector:
    matchLabels:
      app: coingecko-adapter
  template:
    metadata:
      labels:
        app: coingecko-adapter
    spec:
      containers:
        - name: adapter
          image: coingecko-adapter-with-proxy:latest
          ports:
            - containerPort: 8080
          env:
            - name: CACHE_TTL
              value: '60s'
            - name: CACHE_CLEANUP_INTERVAL
              value: '120s'
            - name: API_KEY
              valueFrom:
                secretKeyRef:
                  name: coingecko-secrets
                  key: api-key
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
```

## Benefits of Using the Proxy

1. **Reduced Load**: Cache frequently requested data to reduce API calls
2. **Cost Savings**: Fewer API calls = lower costs for rate-limited/paid APIs
3. **Better Performance**: Cached responses are served instantly
4. **Request Coalescing**: Duplicate concurrent requests are deduplicated
5. **Built-in Metrics**: Monitor cache performance and effectiveness

## When to Use

✅ **Good for:**

- Rate-limited APIs
- Expensive/slow external APIs
- High-traffic scenarios with repeated requests
- APIs with data that doesn't change frequently

❌ **Not recommended for:**

- Real-time data requirements (use very short TTL)
- Unique requests that won't benefit from caching
- Very low traffic scenarios

## Troubleshooting

### Proxy not starting

Check logs for configuration errors:

```bash
docker logs <container-id> 2>&1 | grep proxy
```

### Adapter not starting

Check logs for Node.js errors:

```bash
docker logs <container-id> 2>&1 | grep node
```

### Low cache hit rate

- Increase `CACHE_TTL` if data freshness allows
- Check if requests have varying parameters
- Review metrics to understand access patterns

### High memory usage

- Decrease `CACHE_TTL`
- Decrease `CACHE_CLEANUP_INTERVAL`
- Monitor unique request patterns

## Reverting to Original Dockerfile

To build without the proxy, simply use the original Dockerfile:

```bash
docker build \
  -f Dockerfile \
  --build-arg location=packages/sources/coingecko \
  --build-arg package=@chainlink/coingecko-adapter \
  -t coingecko-adapter:latest \
  .
```

## Support

For issues specific to:

- **Reader Proxy**: See [reader-proxy/README.md](reader-proxy/README.md)
- **Adapters**: See adapter-specific documentation in the package directory
