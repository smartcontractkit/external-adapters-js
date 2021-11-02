# Chainlink External Adapter for Bea

### Environment Variables

| Required? |  Name   |                            Description                             | Options | Defaults to |
| :-------: | :-----: | :----------------------------------------------------------------: | :-----: | :---------: |
|           | API_KEY | An API key that can be obtained from the data provider's dashboard |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|           | endpoint | The endpoint to use | [average](#Average-Endpoint) |   average   |

---

## Average Endpoint

### Input Params

| Required? |   Name   |        Description         |         Options         | Defaults to |
| :-------: | :------: | :------------------------: | :---------------------: | :---------: |
|           |  `last`  | The last N months to query |      `1`, `2`, etc      |      3      |
|           | `series` |  The series code to query  | `DGDSRG`, `DPCERG`, etc |  `DPCERG`   |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "last": 3,
    "series": "DGDSRG"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 115.85033333333335,
  "maxAge": 30000,
  "statusCode": 200,
  "data": {
    "result": 115.85033333333335
  }
}
```
