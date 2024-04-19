# DLC_BTC_POR

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/dlc-btc-por/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |            Name            |                                        Description                                        |  Type  |             Options             |                   Default                    |
| :-------: | :------------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----------------------------: | :------------------------------------------: |
|    ✅     |          RPC_URL           |                          The RPC URL to connect to the EVM chain                          | string |                                 |                                              |
|    ✅     |          CHAIN_ID          |                                The chain id to connect to                                 | number |                                 |                   `42161`                    |
|    ✅     |        DLC_CONTRACT        |                        Contract address to fetch all funded vaults                        | string |                                 | `0x20157DBAbb84e3BBFE68C349d0d44E48AE7B5AD2` |
|    ✅     | BITCOIN_BLOCKCHAIN_API_URL |                               URL of bitcoin blockchain api                               | string |                                 |                                              |
|    ✅     |      BITCOIN_NETWORK       |                                   Bitcoin network name                                    |  enum  | `mainnet`, `regtest`, `testnet` |                  `mainnet`                   |
|    ✅     |       CONFIRMATIONS        |                      The number of confirmations to query data from                       | number |                                 |                     `6`                      |
|           |   BACKGROUND_EXECUTE_MS    | The amount of time the background execute should sleep before performing the next request | number |                                 |                   `10000`                    |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                       Options                                        |       Default       |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------: | :-----------------: |
|           | endpoint | The endpoint to use | string | [por](#proof-of-reserves-endpoint), [proof-of-reserves](#proof-of-reserves-endpoint) | `proof-of-reserves` |

## Proof-of-reserves Endpoint

Supported names for this endpoint are: `por`, `proof-of-reserves`.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "proof-of-reserves"
  }
}
```

---

MIT License
