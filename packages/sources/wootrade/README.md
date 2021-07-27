# Chainlink External Adapter for Wootrade

Adapter using the public Wootrade market API for both HTTP(s) and WS.

An example adapter description

### Environment Variables

| Required? |  Name   |                                                        Description                                                         | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|     ✅      | API_KEY | An API key that can be obtained from the data provider's dashboard (add a ✅ in `Required?` if this parameter is required) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|           | endpoint | The endpoint to use | [crypto](#Crypto-Endpoint) |   ticker   |

---

## Crypto Endpoint

An example endpoint description

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    |  |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to |  |             |

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
