# Chainlink External Adapter for Marketstack

Version: 1.2.17

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |             Default              |
| :-------: | :----------: | :---------: | :----: | :-----: | :------------------------------: |
|    ✅     |   API_KEY    |             | string |         |                                  |
|           | API_ENDPOINT |             | string |         | `http://api.marketstack.com/v1/` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                     Options                      | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [eod](#stock-endpoint), [stock](#stock-endpoint) | `stock` |

---

## Stock Endpoint

**NOTE: the `eod` endpoint is temporarily still supported, however, is being deprecated. Please use the `stock` endpoint instead.**

Supported names for this endpoint are: `eod`, `stock`.

### Input Params

| Required? |   Name   |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base   | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|           | interval |                | The symbol of the currency to convert to | string |         | `1min`  |            |                |
|           |  limit   |                |     The limit for number of results      | number |         |   `1`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "stock",
    "base": "AAPL",
    "interval": "1min",
    "limit": 1
  },
  "rateLimitMaxAge": 2921840
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 164.77
  },
  "result": 164.77,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
