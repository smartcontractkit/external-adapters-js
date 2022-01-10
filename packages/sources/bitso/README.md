# Chainlink External Adapter for Bitso

Version: 1.2.1

##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint) | `crypto` |

---

## Crypto Endpoint

Supported names for this endpoint are: `ticker`, `crypto`.

### Input Params

| Required? |    Name    |    Aliases     |                               Description                               |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------: | :------------: | :---------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |    base    | `from`, `coin` |                   The symbol of the currency to query                   | string |         |         |            |                |
|    ✅     |   quote    | `to`, `market` |                The symbol of the currency to convert to                 | string |         |         |            |                |
|           | resultPath |                | The object path to access the value that will be returned as the result | string |         | `vwap`  |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "ticker",
    "base": "BTC",
    "quote": "ARS",
    "resultPath": "vwap"
  },
  "rateLimitMaxAge": 1111
}
```

Response:

```json
{
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
}
```
