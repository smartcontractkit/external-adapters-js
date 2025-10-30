# Reader Proxy

A high-performance Go service that provides request coalescing and short-lived caching to reduce unnecessary load on downstream services.

## Features

- **Request Coalescing**: Deduplicates concurrent requests for the same resource using the singleflight pattern
- **TTL-based Caching**: Configurable cache with automatic expiration and cleanup
- **Metrics Endpoint**: Built-in metrics for monitoring cache performance
- **Health Check**: Standard health check endpoint
- **Graceful Shutdown**: Proper cleanup on termination
- **Configurable**: All settings via environment variables

## How It Works

1. **Request Coalescing**: When multiple identical requests arrive simultaneously, only one request is forwarded to the downstream service. All other requests wait for and share the same response.

2. **Caching**: Successful responses are cached for a configurable TTL. Subsequent requests for the same resource are served from cache without hitting the downstream service.

3. **Cache Key Generation**: Cache keys are generated based on:
   - HTTP method
   - URL path
   - Query parameters
   - Request body (for POST/PUT)
   - Optional custom headers

## Installation

### Using Go

```bash
# Clone or navigate to the reader-proxy directory
cd reader-proxy

# Download dependencies
go mod download

# Build the binary
go build -o reader-proxy .

# Run
./reader-proxy
```

### Using Make

```bash
# Build
make build

# Run
make run

# Build Docker image
make docker-build

# Run in Docker
make docker-run
```

### Using Docker

```bash
# Build the image
docker build -t reader-proxy:latest .

# Run the container
docker run -p 8080:8080 \
  -e DOWNSTREAM_URL=http://your-service:8081 \
  -e CACHE_TTL=30s \
  reader-proxy:latest
```

## Configuration

All configuration is done via environment variables:

| Variable                 | Description                                     | Default                 |
| ------------------------ | ----------------------------------------------- | ----------------------- |
| `PORT`                   | Port to listen on                               | `8080`                  |
| `DOWNSTREAM_URL`         | URL of the downstream service to proxy to       | `http://localhost:8081` |
| `CACHE_TTL`              | Cache time-to-live (e.g., "30s", "5m", "1h")    | `30s`                   |
| `CACHE_CLEANUP_INTERVAL` | How often to clean expired cache entries        | `60s`                   |
| `CACHE_404`              | Whether to cache 404 responses                  | `false`                 |
| `DOWNSTREAM_TIMEOUT`     | Timeout for downstream requests                 | `30s`                   |
| `READ_TIMEOUT`           | Server read timeout                             | `10s`                   |
| `WRITE_TIMEOUT`          | Server write timeout                            | `10s`                   |
| `IDLE_TIMEOUT`           | Server idle timeout                             | `120s`                  |
| `CACHE_KEY_HEADERS`      | Comma-separated headers to include in cache key | ``                      |

### Example Configuration

Create a `.env` file (or copy from `.env.example`):

```bash
PORT=8080
DOWNSTREAM_URL=http://api.example.com
CACHE_TTL=1m
CACHE_CLEANUP_INTERVAL=5m
CACHE_404=true
DOWNSTREAM_TIMEOUT=30s
CACHE_KEY_HEADERS=Authorization,X-API-Key
```

Then run with:

```bash
export $(cat .env | xargs) && ./reader-proxy
```

## Endpoints

### Proxy Endpoint

**All requests** to the root path and any sub-paths are proxied to the downstream service:

```bash
# GET request
curl http://localhost:8080/api/users

# POST request
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John"}'
```

Cached responses include an `X-Cache: HIT` header.

### Health Check

```bash
curl http://localhost:8080/health
```

Response:

```json
{ "status": "ok" }
```

### Metrics

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

Metrics explanation:

- `total_requests`: Total number of requests received
- `cache_hits`: Number of requests served from cache
- `cache_misses`: Number of requests that required downstream fetch
- `cache_hit_rate`: Percentage of requests served from cache
- `cache_size`: Current number of items in cache
- `coalesced_requests`: Number of requests that were deduplicated

## Use Cases

### 1. Protecting Rate-Limited APIs

```bash
# Proxy to a rate-limited API with aggressive caching
export DOWNSTREAM_URL=https://api.rate-limited-service.com
export CACHE_TTL=5m
./reader-proxy
```

### 2. Reducing Database Load

```bash
# Proxy to a service that queries a database frequently
export DOWNSTREAM_URL=http://db-service:3000
export CACHE_TTL=30s
./reader-proxy
```

### 3. Handling Traffic Spikes

```bash
# Coalesce duplicate requests during traffic spikes
export DOWNSTREAM_URL=http://backend-api:8000
export CACHE_TTL=1m
./reader-proxy
```

### 4. Development/Testing

```bash
# Use as a mock server with caching for faster tests
export DOWNSTREAM_URL=http://mock-api:9000
export CACHE_TTL=10m
./reader-proxy
```

## Performance Considerations

- **Memory Usage**: Cache size grows with unique requests. Monitor memory usage and adjust `CACHE_TTL` accordingly.
- **Cache Key Headers**: Only include headers in the cache key if they affect the response (e.g., `Authorization` for user-specific data).
- **TTL Selection**: Balance between cache freshness and load reduction. Start with 30s-1m for most use cases.
- **Cleanup Interval**: Should be ~2x the cache TTL for optimal balance between memory cleanup and overhead.

## Development

### Running Tests

```bash
make test
```

### Code Formatting

```bash
make fmt
```

### Building

```bash
# Local build
make build

# Docker build
make docker-build
```

## Architecture

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     ▼
┌─────────────────┐
│  Reader Proxy   │
│                 │
│  ┌───────────┐  │
│  │  Cache    │  │
│  │  (TTL)    │  │
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │ Singleflight│ │
│  │ (Coalesce) │  │
│  └───────────┘  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Downstream     │
│  Service        │
└─────────────────┘
```

## Integration with External Adapters

The reader-proxy can be integrated directly into adapter Docker images. A combined Dockerfile (`Dockerfile.with-proxy`) is available at the repository root that builds both the Go proxy and Node.js adapter in a single image.

### Quick Build

Use the provided build script from the repository root:

```bash
# Build any adapter with proxy included
./build-with-proxy.sh packages/sources/coingecko @chainlink/coingecko-adapter

# Or specify a custom image tag
./build-with-proxy.sh packages/sources/coingecko @chainlink/coingecko-adapter coingecko-proxy:v1.0
```

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for detailed integration documentation.

## License

This project is part of the external-adapters-js repository.

## Contributing

Contributions are welcome! Please ensure code is properly formatted and tested before submitting PRs.
