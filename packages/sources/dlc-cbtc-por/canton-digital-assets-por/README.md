# DLC CBTC Canton Digital Assets Proof of Reserves Adapter

This adapter queries the Digital Asset API to retrieve the total CBTC supply on the Canton network.

## Configuration

| Variable         | Required | Description                                   |
| ---------------- | -------- | --------------------------------------------- |
| `CANTON_API_URL` | Yes      | Digital Asset API endpoint URL for token data |

## Endpoints

### `supply`

Returns the total CBTC supply as an integer string (scaled by 10^decimals).

**Aliases:** `totalSupply`, `reserves`

#### Example Request

```json
{
  "data": {
    "endpoint": "supply"
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

The `result` is a **string** to preserve precision for values exceeding `Number.MAX_SAFE_INTEGER`.

For example, if the API returns `totalSupply: "11.7127388"` with `decimals: 10`, the result will be `"117127388000"` (11.7127388 × 10^10).

## Error Handling

The adapter returns a 502 error when:

- No instruments found in API response
- CBTC instrument not found
- `totalSupply` is missing, empty, or whitespace-only
- `decimals` is missing or negative
- `totalSupply` is not a valid numeric string

The adapter **never** returns a default value like `0` on error - it either succeeds with valid data or fails explicitly.

## Running Locally

```bash
# Build
yarn build

# Set environment variable
export CANTON_API_URL="https://api.utilities.digitalasset.com/api/token-standard/v0/registrars/cbtc-network::12205af3b949a04776fc48cdcc05a060f6bda2e470632935f375d1049a8546a3b262/registry/metadata/v1/instruments"

# Start
yarn start

# Query (in another terminal)
curl -X POST http://localhost:8080 -H "Content-Type: application/json" -d '{"data": {}}'
```

## Running Tests

```bash
# From repo root
yarn jest packages/sources/dlc-cbtc-por/canton-digital-assets-por/test/unit/ --no-coverage
```
