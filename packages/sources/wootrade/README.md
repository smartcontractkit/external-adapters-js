# Chainlink External Adapter for Wootrade

Version: 1.1.17

Adapter using the public Wootrade market API for both HTTP(s) and WS.

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |      Name       |            Description            |  Type  | Options | Default |
| :-------: | :-------------: | :-------------------------------: | :----: | :-----: | :-----: |
|           |   API_ENPOINT   |                                   |        |         |         |
|           | WS_API_ENDPOINT |                                   |        |         |         |
|           |     API_KEY     | An key to use the wootrade WS API | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                        Options                         | Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [ticker](#crypto-endpoint) | `crypto` |

---

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
