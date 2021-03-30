# Chainlink External Adapter for Tradingeconomics

This adapter uses the Tradingeconomics WS stream

### Environment variables

| Required? |        Name         |                               Description                               | Options |             Defaults to             |
| :-------: | :-----------------: | :---------------------------------------------------------------------: | :-----: | :---------------------------------: |
|     ❌     |      `API_URL`      |                       The URL of the WS endpoint                        |         | `ws://stream.tradingeconomics.com/` |
|     ✅     |  `API_CLIENT_KEY`   |                           Your API client key                           |         |                                     |
|     ✅     | `API_CLIENT_SECRET` |                         Your API client secret                          |         |                                     |
|     ✅     |      `SYMBOLS`      | A comma delimited list of symbols to fetch prices for. E.g: "FTSE,N225" |         |                                     |
|     ❌     | `RECONNECT_TIMEOUT` |        Time to wait in ms before reconnecting the WS connection         |         |                3000                 |

### Input Params

| Required? |            Name            |           Description            |     Options      | Defaults to |
| :-------: | :------------------------: | :------------------------------: | :--------------: | :---------: |
|     ✅     | `base`, `from`, or `asset` | The symbol of the asset to query | one of `SYMBOLS` |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "FTSE"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 6663.73
  },
  "result": 6663.73,
  "statusCode": 200
}
```
