# Chainlink External Adapter for Bitso

### Input Parameters

| Required? |   Name   |     Description     |          Options           | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------: | :---------: |
|           | endpoint | The endpoint to use | [crypto](#Crypto-Endpoint) |  `crypto`   |

---

## Crypto Endpoint
##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.
### Input Params

| Required? |            Name            |                               Description                               | Options | Defaults to |
| :-------: | :------------------------: | :---------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |                   The symbol of the currency to query                   |         |             |
|    ✅     | `quote`, `to`, or `market` |                The symbol of the currency to convert to                 |         |             |
|           |          `field`           | The object path to access the value that will be returned as the result |         |   `vwap`    |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "BTC",
    "quote": "ARS"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "payload": {
      "high": "1581920.78",
      "last": "1567306.98",
      "created_at": "2020-10-06T10:57:38+00:00",
      "book": "btc_ars",
      "volume": "16.96252687",
      "vwap": "1568906.7103474855",
      "low": "1553404.00",
      "ask": "1574120.27",
      "bid": "1567306.98",
      "change_24": "2345.15"
    },
    "result": 1567306.98
  },
  "result": 1567306.98,
  "statusCode": 200
}
```
