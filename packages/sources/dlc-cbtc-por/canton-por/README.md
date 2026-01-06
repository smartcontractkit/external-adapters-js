# DLC CBTC Canton Proof of Reserves Adapter

This adapter queries multiple APIs to retrieve the CBTC supply for the Canton network:

- **Digital Asset API** (`daSupply`): Token metadata from Digital Asset's API
- **Attester API** (`attesterSupply`): Bitcoin reserves from DLC.Link attesters

## Configuration

| Variable           | Required | Description                                                       |
| ------------------ | -------- | ----------------------------------------------------------------- |
| `CANTON_API_URL`   | No       | Digital Asset API endpoint URL for token metadata                 |
| `ATTESTER_API_URL` | No       | Attester API base URL (e.g., https://mainnet.dlc.link/attestor-1) |

At least one URL should be configured to use the corresponding endpoint.

The adapter uses `CACHE_MAX_AGE: 10000` (10 seconds) to ensure data is refreshed frequently for PoR use cases.

## Endpoints

### `daSupply` (default)

Returns the total CBTC supply from the Digital Asset API as an integer string (scaled by 10^decimals).

_No aliases_

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
  "result": "117127388000",
  "data": {
    "result": "117127388000"
  },
  "statusCode": 200
}
```

### `attesterSupply`

Returns the total CBTC supply from the DLC.Link Attester API as an integer string (scaled by 10^10).

_No aliases_

#### Example Request

```json
{
  "data": {
    "endpoint": "attesterSupply"
  }
}
```

#### Example Response

```json
{
  "result": "78998232600",
  "data": {
    "result": "78998232600"
  },
  "statusCode": 200
}
```

The Attester API returns values like `"7.899823260000001"` which are converted to base units with 10 decimal precision.

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
export ATTESTER_API_URL="https://mainnet.dlc.link/attestor-1"

# Start
yarn start

# Query daSupply (default, in another terminal)
curl -X POST http://localhost:8080 -H "Content-Type: application/json" -d '{"data": {}}'

# Query attesterSupply
curl -X POST http://localhost:8080 -H "Content-Type: application/json" -d '{"data": {"endpoint": "attesterSupply"}}'
```

## Running Tests

```bash
# From repo root
yarn jest packages/sources/dlc-cbtc-por/canton-por/test/unit/ --no-coverage
```
