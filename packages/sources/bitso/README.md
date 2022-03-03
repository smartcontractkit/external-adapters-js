# Chainlink External Adapter for Bitso

Version: 1.2.17

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |          Default           |
| :-------: | :----------: | :---------: | :----: | :-----: | :------------------------: |
|           | API_ENDPOINT |             | string |         | `https://api.bitso.com/v3` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                        Options                         | Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [ticker](#crypto-endpoint) | `crypto` |

---

## Crypto Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

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
    "endpoint": "ticker",
    "base": "BTC",
    "quote": "ARS"
  },
  "rateLimitMaxAge": 1111
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "payload": {
      "high": "13504981.32",
      "last": "12550294.29",
      "created_at": "2021-11-16T18:50:20+00:00",
      "book": "btc_ars",
      "volume": "5.79730623",
      "vwap": "12806994.5372860099",
      "low": "12100000.00",
      "ask": "12550291.01",
      "bid": "12520297.85",
      "change_24": "-849449.19"
    },
    "result": 12806994.53728601
  },
  "result": 12806994.53728601,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
