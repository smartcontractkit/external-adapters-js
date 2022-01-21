# Chainlink External Adapter for Unibit

Version: 1.2.1

| Required? |     Name     |         Description          | Options |            Defaults to            |
| :-------: | :----------: | :--------------------------: | :-----: | :-------------------------------: |
|    ✅     |   API_KEY    |      API key for Unibit      |         |                                   |
|           | API_ENDPOINT | The endpoint for your Unibit |         | `https://api.unibit.ai/v2/stock/` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |              Options               |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [historical](#historical-endpoint) | `historical` |

---

## Historical Endpoint

Supported names for this endpoint are: `historical`, `eod`.

This historical endpoint provides the closing price of the previous day as detailed in [Unibit documentation](https://unibit.ai/api/docs/V2.0/historical_stock_price).

NOTE: each request sent to this endpoint has a cost of 10 credits

### Input Params

| Required? | Name |              Aliases               |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :--------------------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `from`, `coin`, `market`, `symbol` | The symbol of the currency to query | string |         |         |            |                |

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
}
```
