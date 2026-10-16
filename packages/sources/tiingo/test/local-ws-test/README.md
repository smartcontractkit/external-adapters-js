# Tiingo WS Failover — Manual Integration Tests

These scripts test end-to-end WebSocket failover behaviour by running two local
proxies between the EA and the real Tiingo upstream, then artificially triggering
abnormal closures via the proxy control API.

## What is tested

- All four transports subscribe and receive live data (IEX, crypto, crypto-lwba, forex)
- Abnormal WS closures (code 1006 / TCP terminate) increment the failover counter
- The 2:1 primary/secondary cycle is respected across 6 rounds of closures:
  - counter=1 → cycle=1 → primary
  - counter=2 → cycle=2 → **SECONDARY** (failover)
  - counter=3 → cycle=0 → primary (failback)
  - counter=4 → cycle=1 → primary
  - counter=5 → cycle=2 → **SECONDARY** (failover again)
  - counter=6 → cycle=0 → primary (failback again)
- IEX always stays on primary (its URL is hardcoded; it does not participate in failover)

## Prerequisites

1. Build the Tiingo EA dist:

   ```bash
   yarn workspace @chainlink/tiingo-adapter build
   ```

2. Export your Tiingo API key:

   ```bash
   export TIINGO_API_KEY=<your-key>
   ```

3. `curl`, `python3`, and `npm` must be on your PATH.
   On first run the script installs the `ws` package into `/tmp/tiingo-proxy-modules`
   (outside the repo) so the proxy can run without interfering with Yarn PnP.

## Running

```bash
export TIINGO_API_KEY=<your-key>
bash test/local-ws-test/test-failover.sh
```

Optional environment overrides:
| Variable | Default | Description |
|-----------------------|---------|------------------------------------|
| `EA_PORT` | 8181 | Port for the local EA HTTP server |
| `PRIMARY_PORT` | 9001 | Port for the primary WS proxy |
| `PRIMARY_CTRL` | 9002 | Control HTTP port for primary proxy |
| `SECONDARY_PORT` | 9003 | Port for the secondary WS proxy |
| `SECONDARY_CTRL` | 9004 | Control HTTP port for secondary proxy |
| `PRIMARY_ATTEMPTS` | 2 | Attempts on primary per cycle |
| `SECONDARY_ATTEMPTS` | 1 | Attempts on secondary per cycle |

## Proxy control API

While the proxy is running you can query and control it directly:

```bash
# List open connections
curl http://localhost:9002/status

# Close all connections abruptly (simulates code 1005 / no status received)
curl -X POST "http://localhost:9002/close?code=1005"

# Close only the IEX connection
curl -X POST "http://localhost:9002/close?code=1005&path=/iex"

# Normal close
curl -X POST "http://localhost:9002/close?code=1000"
```

## Log files

After a run, full logs are available at:

- `/tmp/tiingo-ea.log` — EA output
- `/tmp/proxy-primary.log` — primary proxy
- `/tmp/proxy-secondary.log` — secondary proxy
