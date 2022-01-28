# Chainlink External Adapter for cfbenchmarks

### Environment variables

| Required? |      Name       |                 Description                  |   Options    | Defaults to |
| :-------: | :-------------: | :------------------------------------------: | :----------: | :---------: |
|    ✅     | `API_USERNAME`  |                                              |              |             |
|    ✅     | `API_PASSWORD`  |                                              |              |             |
|           | `API_SECONDARY` | Use the secondary endpoint from cfbenchmarks | true / false |    false    |

---

### Input Parameters

| Required? |   Name   |     Description     |          Options           | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------: | :---------: |
|           | endpoint | The endpoint to use | [values](#Values-Endpoint) |  `values`   |

---

## Values Endpoint

### Input Params

| Required? |  Name   |                                          Description                                           | Options | Defaults to |
| :-------: | :-----: | :--------------------------------------------------------------------------------------------: | :-----: | :---------: |
|           | `index` |                                      The ID of the index                                       |         |             |
|           | `base`  |     The base asset to convert from (if index is not present), aliased to `from` and `coin`     |         |             |
|           | `quote` | The quote asset to convert to (if index is not present), aliased to `to`, `market`, and `term` |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "index": "BRR"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 30363.12
  },
  "result": 30363.12,
  "statusCode": 200
}
```

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
  "data": {
    "result": 3000.12
  },
  "result": 3000.12,
  "statusCode": 200
}
```
