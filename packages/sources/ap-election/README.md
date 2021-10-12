# Chainlink External Adapter for Ap-election

(please fill out with corresponding information)

The AP Election adapter fetches the latest election results provided by the Associated Press API and returns the winner of a given election.

### Environment Variables

| Required? |  Name   | Description | Options | Defaults to |
| :-------: | :-----: | :---------: | :-----: | :---------: |
|    ✅     | API_KEY |             |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |             Options              | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------------: | :---------: |
|           | election | The endpoint to use | [example](#Ap-election-Endpoint) |   example   |

---

## Ap-election Endpoint

An example endpoint description

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    | `BTC`, `ETH`, `USD` |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to | `BTC`, `ETH`, `USD` |             |

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
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "price": 77777.77,
    "result": 77777.77
  },
  "statusCode": 200
}
```
