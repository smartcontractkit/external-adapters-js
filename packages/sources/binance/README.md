# Chainlink External Adapter for Binance

Adapter using the public Binance market API for both HTTP(s) and WS.

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|           | endpoint | The endpoint to use | [ticker](#Ticker-Endpoint) |   ticker   |

---

## Ticker Endpoint

An example endpoint description

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    | |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to | |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USDT"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "result": 2429.02,
  "data": {
    "result": 2429.02
  },
  "statusCode": 200
}
```
