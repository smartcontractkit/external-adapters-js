# Chainlink External Adapter for AlphaChain (SDR)

### Environment Variables

| Required? |  Name   |                          Description                          | Options | Defaults to |
| :-------: | :-----: | :-----------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from the AlphaChain dashboard |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |              Options              | Defaults to |
| :-------: | :------: | :-----------------: | :-------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [dataquery](#Data-Query-Endpoint) |  dataquery  |

---

## Data Query Endpoint

Retrieves price data for a given currency pair

### Input Params

| Required? |          Name           |                               Description                               | Options | Defaults to |
| :-------: | :---------------------: | :---------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |                   The symbol of the currency to query                   |         |             |
|    ✅     | `quote`, `to`, `market` |                The symbol of the currency to convert to                 |         |             |
|           |         `field`         | The object path to access the value that will be returned as the result |         |  `result`   |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "SDR"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "from_symbol": "ETH",
      "last_refreshed": "2020-05-29 08:45:03 +0000 UTC",
      "rate": 301.3654364,
      "time_zone": "UTC",
      "to_symbol": "SDR"
    },
    "jobRunID": "",
    "result": 301.3654364,
    "status": "200"
  },
  "result": 301.3654364,
  "statusCode": 200
}
```
