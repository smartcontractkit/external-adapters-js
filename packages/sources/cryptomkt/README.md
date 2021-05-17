# Chainlink External Adapter for CryptoMKT

### Input Parameters

| Required? |   Name   |     Description     |          Options           | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------: | :---------: |
|           | endpoint | The endpoint to use | [ticker](#Ticker-Endpoint) |   ticker    |

---

## Ticker Endpoint

### Input Params

| Required? |          Name           |                               Description                               | Options | Defaults to  |
| :-------: | :---------------------: | :---------------------------------------------------------------------: | :-----: | :----------: |
|    ✅     | `base`, `from`, `coin`  |                   The symbol of the currency to query                   |         |              |
|    ✅     | `quote`, `to`, `market` |                The symbol of the currency to convert to                 |         |              |
|           |         `field`         | The object path to access the value that will be returned as the result |         | `last_price` |

### Sample Input

```json
{
  "id": "1",
  "data": { "coin": "BTC", "market": "ARS" }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "status": "success",
    "data": [
      {
        "timestamp": "2020-10-06T10:51:51.332281",
        "market": "BTCARS",
        "bid": "1559980",
        "ask": "1578940",
        "last_price": "1559980",
        "low": "1530000",
        "high": "1595500",
        "volume": "3.754635486362988398"
      }
    ],
    "result": 1559980
  },
  "result": 1559980,
  "statusCode": 200
}
```
