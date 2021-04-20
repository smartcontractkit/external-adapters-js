# Chainlink External Adapter for Intrinio

This adapter uses the Intrinio WS stream

### Environment variables

| Required? |      Name      |                                                      Description                                                       |        Options         | Defaults to |
| :-------: | :------------: | :--------------------------------------------------------------------------------------------------------------------: | :--------------------: | :---------: |
|    ✅     |   `API_KEY`    |                                                  Your API client key                                                   |                        |             |
|    ✅     |   `SYMBOLS`    |                        A comma delimited list of symbols to fetch prices for. E.g: "MSFT,AAPL"                         |                        |             |
|           | `API_PROVIDER` | Intrinio allows subscription to different [channels/resources](https://github.com/intrinio/intrinio-realtime-node-sdk) | `iex`, `quodd`, `fxcm` |    `iex`    |

**NOTE: `quodd` and `fxcm` have not been tested. `iex` is the recommended (and default) websocket subscription**

### Input Params

| Required? |            Name            |           Description            |     Options      | Defaults to |
| :-------: | :------------------------: | :------------------------------: | :--------------: | :---------: |
|    ✅     | `base`, `from`, or `asset` | The symbol of the asset to query | one of `SYMBOLS` |             |

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
