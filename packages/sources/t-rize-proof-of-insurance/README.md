# T_RIZE_PROOF_OF_INSURANCE

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/t-rize-proof-of-insurance/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Staging vs. Production

| Environment | URL                                                                       |
| ----------- | ------------------------------------------------------------------------- |
| Testnet     | `https://proof.t-rize.ca/v1/asset-verifier/merkle-tree/current-root`      |
| Mainnet     | `https://proof.t-rize.network/v1/asset-verifier/merkle-tree/current-root` |

The adapter defaults to the **production** endpoint. For testnet, set `API_ENDPOINT=https://proof.t-rize.ca/v1/asset-verifier/merkle-tree/current-root`.

## Output Shape

The adapter returns T-Rize carrier values and leaves any downstream stream-schema mapping or renaming to the jobspec.

Because the downstream stream still targets SmartData v9 carrier fields, the adapter truncates `root` and `contractId` to the leftmost 23 bytes and converts those truncated bytes to decimal strings. These are deterministic derived values for T-Rize to replicate during verification, not the full raw provider values.

| Field                                    | Type   | Description                                                      |
| ---------------------------------------- | ------ | ---------------------------------------------------------------- |
| `result`                                 | string | Leftmost 23 bytes of `root`, converted to a decimal string       |
| `data.root`                              | string | Leftmost 23 bytes of `root`, converted to a decimal string       |
| `data.contractId`                        | string | Leftmost 23 bytes of `contractId`, converted to a decimal string |
| `timestamps.providerIndicatedTimeUnixMs` | number | Provider timestamp from `computedAt` in Unix milliseconds        |

## Sample Output

```json
{
  "result": "1354379164455806330400696522124505861414782960378538491",
  "statusCode": 200,
  "data": {
    "root": "1354379164455806330400696522124505861414782960378538491",
    "contractId": "57162387792002371595947067494468869255362946836973445"
  },
  "timestamps": {
    "providerIndicatedTimeUnixMs": 1773147978000
  }
}
```

## Environment Variables

| Required? |     Name      |                                                     Description                                                     |  Type  | Options |                                  Default                                  |
| :-------: | :-----------: | :-----------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----------------------------------------------------------------------: |
|           | API_ENDPOINT  | The T-Rize current-root endpoint URL. Defaults to production. Set to the testnet current-root endpoint for testnet. | string |         | `https://proof.t-rize.network/v1/asset-verifier/merkle-tree/current-root` |
|    ✅     | TRIZE_API_KEY |                         API key for T-Rize asset-verifier API (passed via x-api-key header)                         | string |         |                                                                           |

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
