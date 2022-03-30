# Chainlink External Adapter for Bitex

Version: 1.3.23

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |     Description      |  Type  | Options |        Default         |
| :-------: | :----------: | :------------------: | :----: | :-----: | :--------------------: |
|           | API_ENDPOINT |                      | string |         | `https://bitex.la/api` |
|           |   API_KEY    | Bitex API key to use | string |         |                        |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                         Options                         | Default  |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [tickers](#crypto-endpoint) | `crypto` |

---

## Crypto Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `tickers`.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "base": "ETH",
    "quote": "ARS"
  },
  "rateLimitMaxAge": 222
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "id": "eth_ars",
      "type": "tickers",
      "attributes": {
        "last": 935234,
        "open": 934713,
        "high": 935234,
        "low": 907110,
        "vwap": 934877.7183770883,
        "volume": 1.257,
        "bid": 879407,
        "ask": 930127,
        "price_before_last": 920016
      }
    },
    "result": 934877.7183770883
  },
  "result": 934877.7183770883,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
