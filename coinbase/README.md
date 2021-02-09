# Chainlink External Adapter for Coinbase

Query information from [Coinbase's API](https://developers.coinbase.com/api/v2)

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-endpoint) |    price    |

---

## Price endpoint

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    | `BTC`, `ETH`, `USD` |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to | `BTC`, `ETH`, `USD` |             |

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "base": "BTC",
      "currency": "USD",
      "amount": "46823.85"
    },
    "result": 46823.85
  },
  "result": 46823.85,
  "statusCode": 200
}
```
