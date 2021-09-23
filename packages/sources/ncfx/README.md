# Chainlink External Adapter for NCFX

This adapter only supports WS connections. Make sure WS is enabled in your configuration in order to run this adapter.

### Environment Variables

| Required? |     Name     |           Description            | Options | Defaults to |
| :-------: | :----------: | :------------------------------: | :-----: | :---------: |
|    ✅     | API_USERNAME | The username to the NCFX account |         |             |
|    ✅     | API_PASSWORD | The password to the NCFX account |         |             |

---

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    | `BTC`, `ETH`, `USD` |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to | `BTC`, `ETH`, `USD` |             |
|           |         `endpoint`         | The symbol of the currency to convert to |  `forex`, `crypto`  |  `crypto`   |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 1802.8985,
  "maxAge": 30000,
  "statusCode": 200,
  "data": {
    "timestamp": "2021-07-20T16:04:27",
    "currencyPair": "ETH/USD",
    "bid": 1802.6985,
    "offer": 1803.0985,
    "mid": 1802.8985,
    "changes": [
      {
        "period": "1h",
        "change": 46.603398,
        "percentage": 2.66
      },
      {
        "period": "1d",
        "change": -18.76243,
        "percentage": -1.02
      }
    ],
    "result": 1802.8985
  }
}
```
