# External Adapter — T-Rize Proof-of-Insurance Data Stream → Data Stream Schema

## Background

T-Rize is creating a proof-of-insurance data stream for a digital fixed-income product being deployed on Canton. T-Rize exposes a merkle tree API that returns a hashed root of insurance policies along with a ledger contract identifier.

A Chainlink External Adapter (EA) is required to query this API and map the returned data into the Chainlink [SmartData v9 report schema](https://docs.chain.link/data-streams/reference/report-schema-v9) for on-chain consumption.

## Objective

Create an External Adapter that:

- Calls the T-Rize asset-verifier API using `x-api-key` header authentication
- Maps returned API fields into the SmartData v9 Data Stream schema
- Converts base64 and hex-encoded values into BigInt string representations
- Returns a fully populated Data Stream payload, with `ripcord` hardcoded to `0`

## Authentication

All requests must include an API key via the `x-api-key` header.

```
x-api-key: <TRIZE_API_KEY>
```

The API key is provided via adapter configuration / environment variables (`TRIZE_API_KEY`).

## T-Rize API

### Endpoint

```
GET /v1/asset-verifier/merkle-tree/current-root
```

### Required Query Parameters

| Parameter        | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `owner_party_id` | Party ID that owns the MerkleTree contract on the ledger |
| `tree_id`        | Tree identifier for the merkle tree                      |

### Base URLs

| Environment          | URL                                      |
| -------------------- | ---------------------------------------- |
| Testnet / Staging    | `https://proof.validator.t-rize.ca`      |
| Mainnet / Production | `https://proof.validator.t-rize.network` |

The adapter defaults to the testnet URL. Set `API_ENDPOINT=https://proof.validator.t-rize.network` for mainnet.

### Example Request

```bash
curl -X 'GET' \
  'https://proof.validator.t-rize.ca/v1/asset-verifier/merkle-tree/current-root?owner_party_id=TRIZEGroup-cantonTestnetValidator-1%3A%3A12205de11e389c7da899c66b0fec93ac08b8e9023e8deb30a1316ed9925955fbf06b&tree_id=tree-001' \
  -H 'accept: application/json' \
  -H 'x-api-key: <REDACTED>'
```

### Response Schema

```json
{
  "treeId": "tree-001",
  "root": "DiPv1Gh+kZXNRkqT7m+xdfzR3tUzafs5BnBqa2/dI3c=",
  "contractId": "000fd9fe74067a4119874294b39f5abde8950c3e19a99bfdfc0b12780f0a18b95eca121220c4f91fbc5c7a9b5d758a6c96df9f626b8e49152c19bd5c67df7c755152940534",
  "computedAt": "2026-03-11T10:50:28Z"
}
```

| Field        | Type   | Description                                      |
| ------------ | ------ | ------------------------------------------------ |
| `treeId`     | string | Tree identifier (informational, not mapped)      |
| `root`       | string | Base64-encoded merkle root of hashed policies    |
| `contractId` | string | Hex-encoded ledger contract identifier           |
| `computedAt` | string | ISO-8601 timestamp of when the root was computed |

### Possible Error Codes

`400` Bad Request, `401` Unauthorized, `404` Contract Not Found, `502` Bad Gateway, `503` Service Unavailable, `504` Gateway Timeout

## Data Stream Schema & Mapping

API response fields are mapped to the SmartData v9 report schema as follows:

| API Field     | v9 Field      | Type   | Encoding                                                         |
| ------------- | ------------- | ------ | ---------------------------------------------------------------- |
| `root`        | `navPerShare` | int192 | Base64 decoded to bytes, interpreted as unsigned BigInt (string) |
| `contractId`  | `aum`         | int192 | Hex string parsed as unsigned BigInt (string)                    |
| `computedAt`  | `navDate`     | uint64 | ISO-8601 timestamp converted to nanoseconds since epoch (string) |
| _(hardcoded)_ | `ripcord`     | uint32 | Always `0` (normal state)                                        |

All large numeric values are serialized as decimal strings in the EA response to avoid JSON precision issues.

### Encoding Logic

```typescript
// root (base64) -> navPerShare (int192)
const navPerShare = BigInt(
  '0x' + Buffer.from(response.data.root, 'base64').toString('hex'),
).toString()

// contractId (hex) -> aum (int192)
const aum = BigInt('0x' + response.data.contractId).toString()

// computedAt (ISO-8601) -> navDate (uint64, nanoseconds)
const navDate = (BigInt(new Date(response.data.computedAt).getTime()) * 1_000_000n).toString()
```

## OPEN ISSUE: int192 Overflow

**Status: Awaiting customer response**

Live testing against the staging API revealed that both `navPerShare` and `aum` exceed the int192 range (max ~2^191):

| Field         | Bits in live data | int192 capacity | Status    |
| ------------- | ----------------- | --------------- | --------- |
| `navPerShare` | 252 bits          | 191 bits        | OVERFLOWS |
| `aum`         | 540 bits          | 191 bits        | OVERFLOWS |
| `navDate`     | 61 bits           | 64 bits         | Fits      |

The `root` field is a 32-byte (256-bit) value and the `contractId` is a 69-byte (552-bit) value, both of which exceed the 191-bit magnitude limit of int192.

### Options Under Consideration

1. **Truncate to 192 bits**: Take the leftmost 24 bytes of each value. Preserves partial uniqueness but loses data.
2. **Hash to fit**: SHA-256 the values and reduce modulo 2^191. Deterministic and collision-resistant but not reversible.
3. **Split / restructure**: Use multiple fields or a different schema approach.
4. **Customer-side change**: T-Rize could shorten `contractId` or provide a pre-truncated value.

A decision is needed from the customer and/or Chainlink before the adapter can be considered production-ready.

## Environment Variables

| Required? | Name            | Description                                                           | Default                             |
| :-------: | --------------- | --------------------------------------------------------------------- | ----------------------------------- |
|           | `API_ENDPOINT`  | T-Rize API base URL. Set to production URL for mainnet.               | `https://proof.validator.t-rize.ca` |
|    Yes    | `TRIZE_API_KEY` | API key for T-Rize asset-verifier API (passed via `x-api-key` header) |                                     |

## EA Behavior Summary

| Phase            | Action                                           | Output                    |
| ---------------- | ------------------------------------------------ | ------------------------- |
| Normal Operation | Fetch API data, encode fields, return v9 payload | Updated v9 schema data    |
| API Error        | Return adapter error                             | No on-chain update        |
| Missing Fields   | Reject request                                   | Adapter error with reason |
| Empty Response   | Return adapter error                             | 502 status                |

No freshness or staleness validation is performed at the adapter level. All validation and liveness checks are handled downstream.

## Error Handling

- Non-200 API responses -> adapter error
- Missing `owner_party_id` or `tree_id` -> 400 validation error
- Invalid parameter types -> 400 validation error
- Empty response body -> 502 adapter error

## Example EA Output

```json
{
  "result": "6395874771323094942866246509284041219047918043164807691569040669030590784375",
  "statusCode": 200,
  "data": {
    "navPerShare": "6395874771323094942866246509284041219047918043164807691569040669030590784375",
    "aum": "3565735350662998690658542233515604059116459109247184598921808741463934710361631760625163663383797730021061915927031079598180859942613397006470863190456289631405364",
    "navDate": "1773226228000000000",
    "ripcord": 0
  }
}
```

## Changes from Original Ticket

This section documents all changes made from the original ticket specification.

### API Changes

| Aspect      | Original                                                  | Current                                                                                           |
| ----------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Endpoint    | `GET /v1/chainlink/{deal_name}/{instrument_id}` (path)    | `GET /v1/asset-verifier/merkle-tree/current-root` (query params)                                  |
| Parameters  | `deal_name`, `instrument_id` (path params)                | `owner_party_id`, `tree_id` (query params)                                                        |
| Auth header | `Authorization: Bearer <token>`                           | `x-api-key: <key>`                                                                                |
| Base URL    | `https://proof.t-rize.io`                                 | `https://proof.validator.t-rize.ca` (testnet), `https://proof.validator.t-rize.network` (mainnet) |
| Response    | `insuredAmount`, `currentExposure`, `daysRemaining`, etc. | `treeId`, `root`, `contractId`, `computedAt` (merkle tree response)                               |

### Schema Mapping Changes

| Aspect           | Original                                            | Current                                                   |
| ---------------- | --------------------------------------------------- | --------------------------------------------------------- |
| `navDate` source | `daysRemaining` (integer, days)                     | `computedAt` (ISO-8601, converted to nanoseconds)         |
| `aum` source     | `signature` (hashed via SHA-256, reduced mod 2^191) | `contractId` (hex parsed as BigInt)                       |
| `navPerShare`    | Not mapped                                          | `root` (base64 decoded to BigInt)                         |
| `ripcord`        | Not specified                                       | Hardcoded to `0`                                          |
| Value types      | `number` (JS)                                       | `string` (BigInt decimal strings to avoid precision loss) |

### Key Technical Decisions

- All large numeric values returned as **decimal strings** (not JS numbers) because they exceed `Number.MAX_SAFE_INTEGER`
- `navDate` also returned as string since nanosecond timestamps exceed 2^53
- `ripcord` hardcoded to `0` (normal state) since the T-Rize API does not provide a pause signal
- `treeId` from the API response is not mapped to any v9 field
