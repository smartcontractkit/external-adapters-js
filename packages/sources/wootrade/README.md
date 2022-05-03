# Chainlink External Adapter for Wootrade

![1.1.30](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/wootrade/package.json)

Adapter using the public Wootrade market API for both HTTP(s) and WS.

Base URL https://api.woo.network

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |            Description            |  Type  | Options | Default |
| :-------: | :-------------: | :-------------------------------: | :----: | :-----: | :-----: |
|           |   API_ENPOINT   |                                   |        |         |         |
|           | WS_API_ENDPOINT |                                   |        |         |         |
|           |     API_KEY     | An key to use the wootrade WS API | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                        Options                         | Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [ticker](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `ticker`.

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
    "quote": "USDT"
  },
  "debug": {
    "cacheKey": "0aaBzX3SO1b91U+WhOHIsT33oj0="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "rows": [
      {
        "symbol": "SPOT_ETH_USDT",
        "side": "SELL",
        "executed_price": 4499.01,
        "executed_quantity": 0.043747,
        "executed_timestamp": "1636138728.930"
      }
    ],
    "result": 4499.01
  },
  "result": 4499.01,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
