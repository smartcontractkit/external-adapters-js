# DLC CBTC Canton Proof of Reserves Adapter

This adapter queries multiple APIs to retrieve the CBTC supply for the Canton network:

- **Digital Asset API** (`daSupply`): Token metadata from Digital Asset's API
- **Attester API** (`attesterSupply`): Bitcoin reserves from DLC.Link attesters

## Configuration

| Variable                | Required | Default | Description                                            |
| ----------------------- | -------- | ------- | ------------------------------------------------------ |
| `CANTON_API_URL`        | No       | -       | Digital Asset API endpoint URL for token metadata      |
| `ATTESTER_API_URLS`     | No       | -       | Comma-separated list of Attester API base URLs         |
| `BACKGROUND_EXECUTE_MS` | No       | 10000   | Interval in milliseconds between background executions |

At least one URL should be configured to use the corresponding endpoint.

## Endpoints

### `attesterSupply` (default)

Returns the total CBTC supply from DLC.Link Attester APIs as an integer string (scaled by 10^10).

Queries multiple attesters in parallel and returns the **median** of successful responses. Requires at least 1 successful response.

Requires `ATTESTER_API_URLS` to be set.

#### Example Request

```json
{
  "data": {}
}
```

#### Example Response

```json
{
  "result": "143127387999",
  "data": {
    "result": "143127387999"
  },
  "statusCode": 200
}
```

The Attester API returns values like `"14.3127387999"` which are converted to base units with 10 decimal precision.

### `daSupply`

Returns the total CBTC supply from the Digital Asset API as an integer string (scaled by 10^decimals).

Requires `CANTON_API_URL` to be set.

#### Example Request

```json
{
  "data": {
    "endpoint": "daSupply"
  }
}
```

#### Example Response

```json
{
  "result": "143127388000",
  "data": {
    "result": "143127388000"
  },
  "statusCode": 200
}
```

## Precision Handling

The `result` is a **string** to preserve precision for values exceeding `Number.MAX_SAFE_INTEGER` (9×10^15).

CBTC uses 10 decimals, so the maximum supply (21M BTC) would be 2.1×10^17 in base units, exceeding JavaScript's safe integer limit.

## Error Handling

The adapter returns a 502 error when:

**daSupply:**

- No instruments found in API response
- CBTC instrument not found
- `totalSupply` is missing, empty, or whitespace-only
- `decimals` is missing or negative

**attesterSupply:**

- No successful attester responses
- Attester status is not `"ready"`
- `total_supply_cbtc` is missing, empty, or whitespace-only
- Invalid numeric format

The adapter **never** returns a default value like `0` on error - it either succeeds with valid data or fails explicitly.

## Running Locally

```bash
# Build
yarn build

# Set environment variables
export CANTON_API_URL="https://api.utilities.digitalasset.com/api/token-standard/v0/registrars/cbtc-network::12205af3b949a04776fc48cdcc05a060f6bda2e470632935f375d1049a8546a3b262/registry/metadata/v1/instruments"
export ATTESTER_API_URLS="https://mainnet.dlc.link/attestor-1,https://mainnet.dlc.link/attestor-2"

# Start
yarn start

# Query attesterSupply (default, in another terminal)
curl -X POST http://localhost:8080 -H "Content-Type: application/json" -d '{"data": {}}'

# Query daSupply
curl -X POST http://localhost:8080 -H "Content-Type: application/json" -d '{"data": {"endpoint": "daSupply"}}'
```

## Running Tests

```bash
# From repo root - run all tests
yarn jest packages/sources/dlc-cbtc-por-canton/test/ --no-coverage

# Run unit tests only
yarn jest packages/sources/dlc-cbtc-por-canton/test/unit/ --no-coverage

# Run integration tests only
yarn jest packages/sources/dlc-cbtc-por-canton/test/integration/ --no-coverage
```
