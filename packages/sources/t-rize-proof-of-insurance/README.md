# T_RIZE_PROOF_OF_INSURANCE

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/t-rize-proof-of-insurance/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Staging vs. Production

| Environment | URL                            |
| ----------- | ------------------------------ |
| Testnet     | `https://proof.t-rize.ca`      |
| Mainnet     | `https://proof.t-rize.network` |

The adapter defaults to the **production** URL. For testnet, set `API_ENDPOINT=https://proof.t-rize.ca`.

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

For this integration, `navPerShare` and `aum` are schema-driven carrier fields: `navPerShare` carries the truncated merkle root and `aum` carries the truncated ledger contract ID. They are not scaled 18-decimal monetary values.

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

## Environment Variables

| Required? |     Name      |                                                     Description                                                     |  Type  | Options |            Default             |
| :-------: | :-----------: | :-----------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------: |
|           | API_ENDPOINT  | The T-Rize API base URL. Defaults to production (proof.t-rize.network). Set to https://proof.t-rize.ca for testnet. | string |         | `https://proof.t-rize.network` |
|    ✅     | TRIZE_API_KEY |                         API key for T-Rize asset-verifier API (passed via x-api-key header)                         | string |         |                                |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                    Note                    |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :----------------------------------------: |
| default |                             |              1              |                           | Configured to poll at most once per minute |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                      Options                       |       Default        |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :------------------: |
|           | endpoint | The endpoint to use | string | [proof-of-insurance](#proof-of-insurance-endpoint) | `proof-of-insurance` |

## Proof-of-insurance Endpoint

`proof-of-insurance` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     | Aliases |                       Description                        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------: | :-----: | :------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | ownerPartyId |         | Party ID that owns the MerkleTree contract on the ledger | string |         |         |            |                |
|    ✅     |    treeId    |         |           Tree identifier for the merkle tree            | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "proof-of-insurance",
    "ownerPartyId": "TRIZEGroup-exampleValidator-1::0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "treeId": "tree-001"
  }
}
```

---

MIT License
