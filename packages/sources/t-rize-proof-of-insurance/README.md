# Chainlink External Adapter for T-Rize Proof-of-Insurance

Queries the T-Rize asset-verifier API for the current merkle tree root of hashed insurance policies and maps the response to the [Chainlink SmartData v9 report schema](https://docs.chain.link/data-streams/reference/report-schema-v9) for on-chain consumption.

The API returns a base64-encoded merkle root and a hex-encoded contract identifier. Because the v9 schema requires integer types, the adapter decodes these values into their BigInt string representations before returning them.

## Environment Variables

| Required? |      Name       |                              Description                              |             Defaults to             |
| :-------: | :-------------: | :-------------------------------------------------------------------: | :---------------------------------: |
|           | `API_ENDPOINT`  |        T-Rize API base URL. Set to production URL for mainnet.        | `https://proof.validator.t-rize.ca` |
|    ✅     | `TRIZE_API_KEY` | API key for T-Rize asset-verifier API (passed via `x-api-key` header) |                                     |

### Staging vs. Production

| Environment | URL                                      |
| ----------- | ---------------------------------------- |
| Testnet     | `https://proof.validator.t-rize.ca`      |
| Mainnet     | `https://proof.validator.t-rize.network` |

The adapter defaults to the **testnet** URL. For mainnet, set `API_ENDPOINT=https://proof.validator.t-rize.network`.

## Input Parameters

| Required? |       Name       |                       Description                        | Options | Defaults to |
| :-------: | :--------------: | :------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `owner_party_id` | Party ID that owns the MerkleTree contract on the ledger |         |             |
|    ✅     |    `tree_id`     |           Tree identifier for the merkle tree            |         |             |

## SmartData v9 Field Mapping

The T-Rize API returns a merkle tree response that is mapped to SmartData v9 fields as follows:

| API Field     | v9 Field      | Type   | Encoding                                                         |
| ------------- | ------------- | ------ | ---------------------------------------------------------------- |
| `root`        | `navPerShare` | int192 | Base64 decoded to bytes, interpreted as unsigned BigInt (string) |
| `contractId`  | `aum`         | int192 | Hex string parsed as unsigned BigInt (string)                    |
| `computedAt`  | `navDate`     | uint64 | ISO-8601 timestamp converted to nanoseconds since epoch (string) |
| _(hardcoded)_ | `ripcord`     | uint32 | Always `0` (normal state)                                        |

`treeId` from the API response is not mapped to a v9 field.

## Sample Input

```json
{
  "data": {
    "owner_party_id": "TRIZEGroup-cantonTestnetValidator-1::12205de11e389c7da899c66b0fec93ac08b8e9023e8deb30a1316ed9925955fbf06b",
    "tree_id": "tree-001",
    "endpoint": "proof_of_insurance"
  }
}
```

## Sample Output

```json
{
  "result": "6395874771323094942866246509284041219047918043164807691569040669030590784375",
  "statusCode": 200,
  "data": {
    "navPerShare": "6395874771323094942866246509284041219047918043164807691569040669030590784375",
    "aum": "34367565276812463052038251888554708750861769973213368775486147369561061578331049976097083787712638383677558180465280922594108094144143485725926441078727332150163096",
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
