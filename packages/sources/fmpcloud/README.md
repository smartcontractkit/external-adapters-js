# Chainlink External Adapter for Fmp Cloud

Version: 1.2.17

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |        Default        |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------------------: |
|    ✅     |   API_KEY    |             | string |         |                       |
|           | API_ENDPOINT |             | string |         | `https://fmpcloud.io` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                   Options                                    | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#stock-endpoint), [quote](#stock-endpoint), [stock](#stock-endpoint) | `stock` |

---

## Stock Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `stock` endpoint instead.**

Supported names for this endpoint are: `price`, `quote`, `stock`.

### Input Params

| Required? | Name |     Aliases     |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `from` | The symbol of the currency to query | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "quote",
    "base": "AUD"
  },
  "rateLimitMaxAge": 384615
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "symbol": "AUDUSD",
        "name": "AUD/USD",
        "price": 0.71222,
        "changesPercentage": -1.329799,
        "change": -0.009471,
        "dayLow": 0.71128,
        "dayHigh": 0.71988,
        "yearHigh": 0.82076,
        "yearLow": 0.71073,
        "marketCap": null,
        "priceAvg50": 0.73820853,
        "priceAvg200": 0.74431854,
        "volume": 0,
        "avgVolume": 0,
        "exchange": "FOREX",
        "open": 0.71903,
        "previousClose": 0.71903,
        "eps": null,
        "pe": null,
        "earningsAnnouncement": null,
        "sharesOutstanding": null,
        "timestamp": 1637945956
      }
    ],
    "result": 0.71222
  },
  "result": 0.71222,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
