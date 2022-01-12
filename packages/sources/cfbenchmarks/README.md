# Chainlink External Adapter for cfbenchmarks

### Environment variables

| Required? |      Name      | Description | Options | Defaults to |
| :-------: | :------------: | :---------: | :-----: | :---------: |
|    ✅     | `API_USERNAME` |             |         |             |
|    ✅     | `API_PASSWORD` |             |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |          Options           | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------: | :---------: |
|           | endpoint | The endpoint to use | [values](#Values-Endpoint) |  `values`   |

---

## Values Endpoint

### Input Params

| Required? |  Name   |     Description     | Options | Defaults to |
| :-------: | :-----: | :-----------------: | :-----: | :---------: |
|    ✅     | `index` | The ID of the index |         |             |

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
