# BALANCE_PRICE

![0.0.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/balance-price/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |               Default                |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------------: |
|           |    WS_API_ENDPOINT    |                       WS endpoint for Gemini market price provider                        | string |         | `wss://api.gemini.com/v2/marketdata` |
|    ✅     |        RPC_URL        |                          The RPC URL to connect to the EVM chain                          | string |         |                                      |
|    ✅     |       CHAIN_ID        |                                The chain id to connect to                                 | number |         |                 `1`                  |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |               `10000`                |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                        Options                         | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "base": "BTC",
    "quote": "USD"
  }
}
```

---

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |       Name        | Aliases |               Description                |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :---------------: | :-----: | :--------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |     addresses     |         |  The addresses to check the balance of   | object[] |         |         |            |                |
|    ✅     | addresses.address |         |     An address to get the balance of     |  string  |         |         |            |                |
|           |    blockNumber    |         | The block number to check the balance at |  number  |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "balance",
    "addresses": [
      {
        "address": "0x61E5E1ea8fF9Dc840e0A549c752FA7BDe9224e99"
      },
      {
        "address": "0x22f44f27A25053C9921037d6CDb5EDF9C05d567D"
      }
    ],
    "blockNumber": 6709240
  }
}
```

---

MIT License
