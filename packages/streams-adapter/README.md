# Streams Adapter Runtime (Go)

This package contains the Go runtime used by streams adapters. It runs alongside the JavaScript adapter process and is optimized for high request throughput.

## What it does

- Exposes an HTTP API for adapter requests.
- Returns cached observations immediately when available.
- Triggers asynchronous subscriptions via the JS adapter when cache data is missing.
- Provides a Redis-compatible endpoint used by the JS adapter to write observations.
- Exposes Prometheus metrics.

## Runtime architecture

The runtime includes two cooperating processes in the streams image:

- **Go streams runtime** (`packages/streams-adapter`): HTTP API, in-memory cache, Redis-compatible ingestion server.
- **JavaScript adapter runtime**: data provider communication and subscription lifecycle.

In the container image, both are managed by `supervisord`. A selector script (`selector.sh`) checks the `STREAMS_ADAPTER` environment variable at startup:

- `STREAMS_ADAPTER=true`: starts the `streams-adapter` supervisor group (Go + JS processes).
- Otherwise: starts the original JS adapter only.

When running in streams mode:

- JS adapter process (`yarn server`) listens internally on `EA_PORT` (default `8070`).
- Go process (`streams-adapter`) listens on `HTTP_PORT` (default `8080`) and `REDCON_PORT` (default `6379`).

The Go runtime waits for the JS adapter `/health` endpoint before starting.

## Request flow

1. Client sends `POST /` to the Go runtime.
2. Request parameters are canonicalized using endpoint/parameter aliases from `endpoint_aliases.json`.
3. Runtime checks in-memory cache:
   - If hit: returns cached observation (`200`).
   - If miss: triggers async subscription request to JS adapter and returns a temporary error (`504`) asking caller to retry.
4. JS adapter writes subscription updates to the Redis-compatible server (`EVAL` path), which updates the cache.
5. Subsequent requests return from cache.

## Endpoints

- `POST /` - main adapter endpoint.
- `GET /health` - health check for Go runtime.
- `GET /metrics` - Prometheus metrics endpoint (served on `METRICS_PORT`, default `9080`).

### Go runtime environment variables

- `HTTP_PORT` (default: `8080`): HTTP API port for the Go runtime.
- `REDCON_PORT` (default: `6379`): Redis-compatible ingestion server port.
- `METRICS_PORT` (default: `9080`): Prometheus metrics server port.
- `CACHE_TTL_MINUTES` (default: `5`): in-memory cache TTL.
- `CACHE_CLEANUP_INTERVAL` (default: `1`): cache cleanup interval; also used as periodic resubscribe interval.
- `SUBSCRIPTION_RETRY_DELAY_SECONDS` (default: `10`): delay before allowing re-subscription after a miss.
- `LOG_LEVEL` (default: `info`): use `debug` to enable Gin request logging and additional debug logs.
- `PACKAGE_NAME` (required for alias mapping): adapter package name, for example `@chainlink/tiingo-adapter`.
- `EA_INTERNAL_HOST` (default: `localhost`): hostname of the internal JS adapter process.

Notes:

- `CACHE_TTL_MINUTES=0` and `CACHE_CLEANUP_INTERVAL=0` both fall back to defaults.
- `PACKAGE_NAME` is used to derive the adapter name for alias index initialization.
- In containerized runs, `PACKAGE_NAME` is injected during image build via the unified `Dockerfile` (`ARG package` -> `ENV PACKAGE_NAME=$package`).

### JS adapter environment expectations (container defaults)

The streams container starts JS adapter with:

- `CACHE_TYPE=redis`
- `CACHE_REDIS_HOST=localhost`
- `EA_PORT=8070`
- `EA_HOST=127.0.0.1`
- `METRICS_ENABLED=false`

## Docker image behavior

The adapter uses a unified `Dockerfile` that builds both the JS adapter bundle and the Go streams-adapter binary into a single image. At runtime, the `STREAMS_ADAPTER` environment variable controls which mode is started:

- `STREAMS_ADAPTER=true`: `selector.sh` starts the `streams-adapter` supervisor group (Go + JS processes running together).
- Otherwise: `selector.sh` starts the original JS adapter only (`yarn server`).

The build process:

1. Builds the JS adapter bundle and generates endpoint aliases.
2. Builds the static Go binary from `packages/streams-adapter`.
3. Copies both into a Node.js Alpine image with `supervisord`.

To run in streams mode:

```sh
docker run -p 8080:8080 -e STREAMS_ADAPTER=true -e API_KEY=... -ti <adapter-image>:<tag>
```
