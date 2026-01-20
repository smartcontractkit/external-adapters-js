# DLC CBTC Proof of Reserves Adapter

This adapter provides multiple endpoints for CBTC proof of reserves:

- **`attesterSupply`** (default): CBTC supply from DLC.Link Attester APIs
- **`daSupply`**: CBTC supply from Digital Asset's API
- **`reserves`**: Bitcoin reserves calculated from on-chain UTXOs

## Configuration

| Variable                | Required | Default          | Description                                                                          |
| ----------------------- | -------- | ---------------- | ------------------------------------------------------------------------------------ |
| `ATTESTER_API_URLS`     | Yes      | -                | Comma-separated list of DLC.Link Attester API base URLs                              |
| `BITCOIN_RPC_ENDPOINT`  | Yes      | -                | Electrs-compatible Bitcoin blockchain API endpoint                                   |
| `CANTON_API_URL`        | No       | -                | Digital Asset API endpoint URL for token metadata                                    |
| `CHAIN_NAME`            | No       | `canton-mainnet` | Chain name to filter addresses (`canton-mainnet`, `canton-testnet`, `canton-devnet`) |
| `BACKGROUND_EXECUTE_MS` | No       | `10000`          | Interval in milliseconds between background executions                               |

## Endpoints

### `attesterSupply` (default)

Returns the total CBTC supply from DLC.Link Attester APIs as an integer string (scaled by 10^10).

Queries multiple attesters in parallel and returns the **median** of successful responses. Requires at least 1 successful response.

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

### `reserves`

Returns the total Bitcoin reserves (in satoshis) across all vault addresses.

The endpoint:

1. Fetches vault address data from attesters
2. Independently calculates Bitcoin addresses from the threshold public key
3. Verifies calculated addresses match attester-provided addresses
4. Queries the Bitcoin blockchain for UTXOs with at least 1 confirmation
5. Returns the **median** reserves across all attesters

#### Example Request

```json
{
  "data": {
    "endpoint": "reserves"
  }
}
```

#### Example Response

```json
{
  "result": "789982326000",
  "data": {
    "result": "789982326000"
  },
  "statusCode": 200
}
```

## Precision Handling

The `result` is a **string** to preserve precision for values exceeding `Number.MAX_SAFE_INTEGER` (9×10^15).

CBTC uses 10 decimals, so the maximum supply (21M BTC) would be 2.1×10^17 in base units, exceeding JavaScript's safe integer limit.

## Error Handling

The adapter returns a 502 error when:

**attesterSupply:**

- No successful attester responses
- Attester status is not `"ready"`
- `total_supply_cbtc` is missing, empty, or whitespace-only

**daSupply:**

- No instruments found in API response
- CBTC instrument not found
- `totalSupply` is missing, empty, or whitespace-only
- `decimals` is missing or negative

**reserves:**

- No successful attester responses
- Address verification fails (calculated address doesn't match attester)
- No vault addresses found for the configured chain

The adapter **never** returns a default value like `0` on error - it either succeeds with valid data or fails explicitly.

## Running Locally

```bash
# Build
yarn build

# Set environment variables
export ATTESTER_API_URLS="https://attester1.example.com,https://attester2.example.com"
export BITCOIN_RPC_ENDPOINT="https://your-electrs-endpoint.com"
export CANTON_API_URL="https://your-canton-api-endpoint.com/instruments"

# Start
yarn start

# Query attesterSupply (default)
curl -X POST http://localhost:8080 -H "Content-Type: application/json" -d '{"data": {}}'

# Query daSupply
curl -X POST http://localhost:8080 -H "Content-Type: application/json" -d '{"data": {"endpoint": "daSupply"}}'

# Query reserves
curl -X POST http://localhost:8080 -H "Content-Type: application/json" -d '{"data": {"endpoint": "reserves"}}'
```

## Running Tests

```bash
# From repo root - run all tests
yarn jest packages/sources/dlc-cbtc-por/test/ --no-coverage

# Run unit tests only
yarn jest packages/sources/dlc-cbtc-por/test/unit/ --no-coverage

# Run integration tests only
yarn jest packages/sources/dlc-cbtc-por/test/integration/ --no-coverage
```
