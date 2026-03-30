# Chainlink External Adapter for T-Rize Proof-of-Insurance

Queries the T-Rize asset-verifier API for the current merkle tree root of hashed insurance policies and maps the response to the [Chainlink SmartData v9 report schema](https://docs.chain.link/data-streams/reference/report-schema-v9) for on-chain consumption.

The API returns a base64-encoded merkle root and a hex-encoded contract identifier. Because the v9 schema requires integer types, the adapter decodes these values into their BigInt string representations before returning them.

## Environment Variables

| Required? |      Name       |                              Description                              |             Defaults to             |
| :-------: | :-------------: | :-------------------------------------------------------------------: | :---------------------------------: |
|           | `API_ENDPOINT`  |        T-Rize API base URL. Set to production URL for mainnet.        | `https://proof.validator.t-rize.ca` |
|    ✅     | `TRIZE_API_KEY` | API key for T-Rize asset-verifier API (passed via `x-api-key` header) |                                     |

### Staging vs. Production

| Environment | URL                                 |
| ----------- | ----------------------------------- |
| Testnet     | `https://proof.validator.t-rize.ca` |
| Mainnet     | `https://proof.t-rize.network`      |

The adapter defaults to the **testnet** URL. For mainnet, set `API_ENDPOINT=https://proof.t-rize.network`.

## Input Parameters

| Required? |       Name       |                       Description                        | Options | Defaults to |
| :-------: | :--------------: | :------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `owner_party_id` | Party ID that owns the MerkleTree contract on the ledger |         |             |
|    ✅     |    `tree_id`     |           Tree identifier for the merkle tree            |         |             |

## SmartData v9 Field Mapping

The T-Rize API returns a merkle tree response that is mapped to SmartData v9 fields as follows:

| API Field     | v9 Field      | Type   | Encoding                                                                                                                    |
| ------------- | ------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| `root`        | `navPerShare` | int192 | Base64 decoded to bytes, truncated to leftmost 24 bytes, validated to fit positive `int192`, interpreted as BigInt (string) |
| `contractId`  | `aum`         | int192 | Hex string truncated to leftmost 48 hex chars (24 bytes), validated to fit positive `int192`, parsed as BigInt (string)     |
| `computedAt`  | `navDate`     | uint64 | ISO-8601 timestamp converted to nanoseconds since epoch (string)                                                            |
| _(hardcoded)_ | `ripcord`     | uint32 | Always `0` (normal state)                                                                                                   |

Values are truncated before conversion and validated to fit positive `int192`. If a truncated value still falls outside that range, the adapter returns a `502` instead of silently coercing it.

`treeId` from the API response is not mapped to a v9 field.

## Sample Input

```json
{
  "data": {
    "owner_party_id": "TRIZEGroup-cantonTestnetValidator-1::12205de11e389c7da899c66b0fec93ac08b8e9023e8deb30a1316ed9925955fbf06b",
    "tree_id": "tree-001",
    "endpoint": "proof-of-insurance"
  }
}
```

## Sample Output

```json
{
  "result": "346721066100686420582578309663873500522184437856905853753",
  "statusCode": 200,
  "data": {
    "navPerShare": "346721066100686420582578309663873500522184437856905853753",
    "aum": "14633571274752607128562449278584030529372914390265201950",
    "navDate": "1773147978000000000",
    "ripcord": 0
  }
}
```

## Testing

Run integration tests from the repository root:

```bash
yarn jest --testPathPattern='packages/sources/t-rize-proof-of-insurance'
```

To update snapshots after response schema changes:

```bash
yarn jest --testPathPattern='packages/sources/t-rize-proof-of-insurance' --updateSnapshot
```
