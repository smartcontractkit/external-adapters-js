# Chainlink External Adapter for Unibit

Version: 1.2.1

This historical endpoint provides the closing price of the previous day as detailed in [Unibit documentation](https://unibit.ai/api/docs/V2.0/historical_stock_price). NOTE: each request sent to this endpoint has a cost of 10 credits

## Environment Variables

| Required? |     Name     |         Description          |  Type  | Options |            Default             |
| :-------: | :----------: | :--------------------------: | :----: | :-----: | :----------------------------: |
|    ✅     |   API_KEY    |      API key for Unibit      | string |         |                                |
|           | API_ENDPOINT | The endpoint for your Unibit |        |         | `https://api-v2.intrinio.com/` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |              Options               |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [historical](#historical-endpoint) | `historical` |

---

## Historical Endpoint

`historical` is the only supported name for this endpoint.

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
