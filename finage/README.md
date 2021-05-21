# Chainlink External Adapter for Finage

### Environment Variables

| Required? |  Name   |                              Description                               | Options | Defaults to |
| :-------: | :-----: | :--------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://finage.co.uk/home) |         |             |

### Input Parameters

| Required? |   Name   |     Description     |                        Options                         |     Defaults to      |
| :-------: | :------: | :-----------------: | :----------------------------------------------------: | :------------------: |
|           | endpoint | The endpoint to use | [relative-performance](#Relative-Performance-Endpoint) | relative-performance |

---

## Relative Performance Endpoint

Returns the percentage change of a stock relative to its sector's change over the last 2 closes

### Input Params

| Required? |   Name   |           Description            | Options | Defaults to |
| :-------: | :------: | :------------------------------: | :-----: | :---------: |
|    ✅     | `symbol` | The symbol of the stock to query |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "symbol": "AAPL"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "result": 1.2341
  },
  "result": 1.2341,
  "statusCode": 200
}
```
