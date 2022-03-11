# Chainlink External Adapter for Unibit

Version: 1.3.12

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     |         Description          |  Type  | Options |              Default              |
| :-------: | :----------: | :--------------------------: | :----: | :-----: | :-------------------------------: |
|    ✅     |   API_KEY    |      API key for Unibit      | string |         |                                   |
|           | API_ENDPOINT | The endpoint for your Unibit |        |         | `https://api.unibit.ai/v2/stock/` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                             Options                             |   Default    |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [eod](#historical-endpoint), [historical](#historical-endpoint) | `historical` |

---

## Historical Endpoint

This historical endpoint provides the closing price of the previous day as detailed in [Unibit documentation](https://unibit.ai/api/docs/V2.0/historical_stock_price).

**NOTE: each request sent to this endpoint has a cost of 10 credits**

Supported names for this endpoint are: `eod`, `historical`.

### Input Params

| Required? | Name |              Aliases               |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :--------------------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from`, `market`, `symbol` | The symbol of the currency to query | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "VXX"
  },
  "rateLimitMaxAge": 57603
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "meta_data": {
      "api_name": "historical_stock_price_v2",
      "num_total_data_points": 1,
      "credit_cost": 10,
      "start_date": "yesterday",
      "end_date": "yesterday"
    },
    "result_data": {
      "VXX": [
        {
          "date": "2021-11-26",
          "volume": 82949400,
          "high": 26.44,
          "low": 22.625,
          "adj_close": 26.16,
          "close": 26.16,
          "open": 22.97
        }
      ]
    },
    "cost": 10,
    "result": 26.16
  },
  "result": 26.16,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
