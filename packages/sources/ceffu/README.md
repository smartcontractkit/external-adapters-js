# CEFFU

![1.0.5](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ceffu/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |           Default            |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :--------------------------: |
|    ✅     |        API_KEY        |                               An API key for Data Provider                                | string |         |                              |
|    ✅     |      PRIVATE_KEY      |                              A Private key for Data Provider                              | string |         |                              |
|    ✅     |       API_PROXY       |                              An API proxy for Data Provider                               | string |         |                              |
|           |     API_ENDPOINT      |                             An API endpoint for Data Provider                             | string |         | `https://open-api.ceffu.com` |
|    ✅     |   ARBITRUM_RPC_URL    |                                 RPC url of Arbitrum node                                  | string |         |                              |
|           | ARBITRUM_RPC_CHAIN_ID |                                     Arbitrum chain id                                     | number |         |           `42161`            |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |           `10000`            |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |        Options         | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [solv](#solv-endpoint) | `solv`  |

## Solv Endpoint

`solv` is the only supported name for this endpoint.

### Input Params

| Required? |       Name        | Aliases |          Description           |   Type   | Options |                   Default                    | Depends On | Not Valid With |
| :-------: | :---------------: | :-----: | :----------------------------: | :------: | :-----: | :------------------------------------------: | :--------: | :------------: |
|    ✅     |     addresses     |         |   List of addresses to read    | object[] |         |                                              |            |                |
|    ✅     | addresses.address |         |    mirrorXLinkId for CEFFU     |  string  |         |                                              |            |                |
|           |  btcUsdContract   |         | BTC/USD price feed on arbitrum |  string  |         | `0x6ce185860a4963106506C203335A2910413708e9` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "solv",
    "addresses": [
      {
        "address": "12345"
      }
    ],
    "btcUsdContract": "0x6ce185860a4963106506C203335A2910413708e9"
  }
}
```

---

MIT License
