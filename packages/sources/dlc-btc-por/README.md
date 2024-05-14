# DLC_BTC_POR

![2.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/dlc-btc-por/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |          Name          |                                        Description                                        |  Type  |             Options             |  Default  |
| :-------: | :--------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----------------------------: | :-------: |
|    ✅     |        RPC_URL         |                          The RPC URL to connect to the EVM chain                          | string |                                 |           |
|    ✅     |        CHAIN_ID        |                              The EVM chain id to connect to                               | number |                                 |           |
|    ✅     |      DLC_CONTRACT      |                        Contract address to fetch all funded vaults                        | string |                                 |           |
|    ✅     |   EVM_RPC_BATCH_SIZE   |                  Number of vaults to fetch from a DLC contract at a time                  | number |                                 |   `100`   |
|    ✅     |    BITCOIN_RPC_URL     |                                THE RPC URL of bitcoin node                                | string |                                 |           |
|    ✅     |    BITCOIN_NETWORK     |                                   Bitcoin network name                                    |  enum  | `mainnet`, `regtest`, `testnet` | `mainnet` |
|    ✅     |     CONFIRMATIONS      |                      The number of confirmations to query data from                       | number |                                 |    `6`    |
|    ✅     | BITCOIN_RPC_GROUP_SIZE |         The number of concurrent RPC calls to BITCOIN_RPC_URL to make at a time.          | number |                                 |   `30`    |
|           | BACKGROUND_EXECUTE_MS  | The amount of time the background execute should sleep before performing the next request | number |                                 |  `10000`  |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [reserves](#reserves-endpoint) | `reserves` |

## Reserves Endpoint

`reserves` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserves"
  }
}
```

---

MIT License
