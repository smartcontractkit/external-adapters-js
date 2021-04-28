# Chainlink External Adapter for Tradingeconomics

This adapter uses the Tradingeconomics WS stream

### Environment variables

| Required? |        Name         |        Description         | Options |                                    Defaults to                                    |
| :-------: | :-----------------: | :------------------------: | :-----: | :-------------------------------------------------------------------------------: |
|           |      `API_URL`      | The URL of the WS endpoint |         | `ws://stream.tradingeconomics.com/` or `https://api.tradingeconomics.com/markets` |
|    ✅     |  `API_CLIENT_KEY`   |    Your API client key     |         |                                                                                   |
|    ✅     | `API_CLIENT_SECRET` |   Your API client secret   |         |                                                                                   |

### Input Params

| Required? |            Name            |           Description            |     Options      | Defaults to |
| :-------: | :------------------------: | :------------------------------: | :--------------: | :---------: |
|    ✅     | `base`, `from`, or `asset` | The symbol of the asset to query | one of `SYMBOLS` |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "aapl:us"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 134.65,
  "statusCode": 200,
  "data": {
    "result": 134.65
  }
}
```
