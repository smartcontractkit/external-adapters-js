# FRXETH-EXCHANGE-RATE

![1.0.5](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/frxeth-exchange-rate/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |          Name           |                                            Description                                            |  Type  | Options |                   Default                    |
| :-------: | :---------------------: | :-----------------------------------------------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |         RPC_URL         |                              The RPC URL to connect to the EVM chain                              | string |         |                                              |
|    ✅     |        CHAIN_ID         |                                    The chain id to connect to                                     | number |         |                     `1`                      |
|    ✅     | FRAX_ETH_PRICE_CONTRACT |                 The address of the deployed Frax Dual Oracle Price Logic contract                 | string |         | `0xb12c19c838499e3447afd9e59274b1be56b1546a` |
|           |  BACKGROUND_EXECUTE_MS  | The number of milliseconds the background execute should sleep before performing the next request | number |         |                    `1000`                    |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

`crypto` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |                   Description                    |  Type  |           Options            | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :----------------------------------------------: | :----: | :--------------------------: | :-----: | :--------: | :------------: |
|    ✅     | priceType |         | The price type to fetch, either 'HIGH' or 'LOW'. | string | `HIGH`, `LOW`, `high`, `low` |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "crypto",
    "priceType": "high"
  }
}
```

---

MIT License
