# Chainlink External Adapter for Marketstack

### Environment Variables

| Required? |  Name   | Description | Options | Defaults to |
| :-------: | :-----: | :---------: | :-----: | :---------: |
|    ✅     | API_KEY |             |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |           Options           | Defaults to |
| :-------: | :------: | :-----------------: | :-------------------------: | :---------: |
|           | endpoint | The endpoint to use | [eod](#End-Of-Day-endpoint) |     eod     |

---

## End Of Day endpoint

### Input Params

| Required? |           Name            |               Description                | Options | Defaults to |
| :-------: | :-----------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin` |   The symbol of the currency to query    |         |             |
|    🟡     |        `interval`         | The symbol of the currency to convert to |         |    1min     |
|    🟡     |          `limit`          |     The limit for number of results      |         |      1      |

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "pagination": { "limit": 1, "offset": 0, "count": 1, "total": 252 },
    "data": [
      {
        "open": 129.19,
        "high": 130.17,
        "low": 128.5,
        "close": 128.98,
        "volume": 100620880,
        "adj_high": 130.17,
        "adj_low": 128.5,
        "adj_close": 128.98,
        "adj_open": 129.19,
        "adj_volume": 100620880,
        "symbol": "AAPL",
        "exchange": "XNAS",
        "date": "2021-01-11T00:00:00+0000"
      }
    ],
    "result": 128.98
  },
  "result": 128.98,
  "statusCode": 200
}
```
