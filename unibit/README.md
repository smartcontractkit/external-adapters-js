# Chainlink External Adapter for Unibit

### Environment Variables

| Required? |     Name     |          Description           | Options |          Defaults to           |
| :-------: | :----------: | :----------------------------: | :-----: | :----------------------------: |
|    ✅     |   API_KEY    |      API key for Unibit      |         |                                |
|           | API_ENDPOINT | The endpoint for your Unibit |         | `https://api-v2.intrinio.com/` |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [historical](#Historical-Endpoint) |   `historical`   |

---

## Historical Endpoint

This historical endpoint provides the closing price of the previous day as detailed in [Unibit documentation](https://unibit.ai/api/docs/V2.0/historical_stock_price).

### Input Params

| Required? |               Name               |             Description             | Options | Defaults to |
| :-------: | :------------------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`, `market` | The symbol of the currency to query |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "VXX"
  }
}
```

### Sample Output

```json
{
    "jobRunID": "1",
    "result": 10.09,
    "statusCode": 200,
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
                    "date": "2021-04-13",
                    "volume": 48604615,
                    "high": 10.21,
                    "low": 10,
                    "adj_close": 10.09,
                    "close": 10.09,
                    "open": 10.17
                }
            ]
        },
        "result": 10.09
    }
}
```
