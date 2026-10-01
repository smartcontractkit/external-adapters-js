# Streams Adapter Client

A Go-based gRPC client for subscribing to Chainlink streams adapters. The client maintains a bidirectional gRPC stream with a streams adapter runtime and displays incoming observations in an interactive terminal UI.

## What it does

- Opens a bidirectional gRPC stream to a streams adapter server.
- Sends full subscription snapshots at a regular interval.
- Receives observations pushed from the server and stores them in an in-memory cache.
- Provides an interactive terminal UI to inspect cached observations, rates, and manage subscriptions.

## Build

```sh
make generate
make run-client
```

To run without Make:

```sh
buf generate
go run ./cmd/client
```

## Configuration

| Environment variable     | Default          | Description                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `SERVER_ADDR`            | `localhost:5050` | gRPC server address. Accepts `host:port` or a URL such as `https://host:port/path`. TLS is enabled when the scheme is `https` or `grpcs`. |
| `CACHE_CLEANUP_INTERVAL` | `60`             | Subscription refresh interval in seconds.                                                                                                 |

## Interactive commands

```
help | h | ?                           Show help
subscribe payload='{"data":{...}}'     Add a new subscription
quit | q                               Exit the client
```

Use `Tab` / `Shift+Tab` to switch between the **Cache**, **Rates**, and **Help** views. Use `PgUp` / `PgDn` to scroll.

## NCFX example

Subscribe to NCFX crypto-lwba price data for ETH/USD:

```sh
SERVER_ADDR=localhost:5050 go run ./cmd/client
```

Then enter the following command in the interactive UI:

```
subscribe payload='{"data":{"endpoint":"cryptolwba","from":"ETH","to":"USD"}}'
```

Or use the `-subscriptions` flag with a JSON file containing the payload list:

```sh
cat > subscriptions.json << 'EOF'
[
  "{\"data\":{\"endpoint\":\"cryptolwba\",\"from\":\"ETH\",\"to\":\"USD\"}}"
]
EOF

SERVER_ADDR=localhost:5050 go run ./cmd/client -subscriptions subscriptions.json
```
