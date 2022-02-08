# Chainlink External Adapter for mock-ea

The Mock EA is to only be used by the integration team for soak testing. It will return a value that deviates after a given interval.

### Environment Variables

| Required? |         Name          |                              Description                              | Options | Defaults to |
| :-------: | :-------------------: | :-------------------------------------------------------------------: | :-----: | :---------: |
|           | UPDATE_INTERVAL_IN_MS | The number of milliseconds to update the result sent back from the EA |         |   300000    |
|           |   DEVIATION_AMOUNT    |                The amount to deviate after an interval                |         |     500     |

---

### Input Parameters

| Required? |   Name   |     Description     |          Options           | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#mock-ea-Endpoint) |    price    |

---

## mock-ea Endpoint

An example endpoint description

### Input Params

N/A

### Sample Input

```json
{
  "id": "1",
  "data": {}
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 1000
  },
  "result": 1000,
  "statusCode": 200
}
```
