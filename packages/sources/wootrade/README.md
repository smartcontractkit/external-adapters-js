# Chainlink External Adapter for Wootrade

Adapter using the public Wootrade market API for both HTTP(s) and WS.

### Input Parameters

| Required? |   Name   |     Description     |          Options           | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------: | :---------: |
|           | endpoint | The endpoint to use | [crypto](#Crypto-Endpoint) |   crypto    |

---

## Crypto Endpoint

### Input Params

| Required? |            Name            |               Description                | Options | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    |         |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to |         |             |

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
  "result": 2230.02,
  "data": {
    "result": 2230.02
  },
  "statusCode": 200
}
```

### Web Sockets

### Environment Variables

| Required? |  Name   |            Description            | Options | Defaults to |
| :-------: | :-----: | :-------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An key to use the wootrade WS API |         |             |

---
