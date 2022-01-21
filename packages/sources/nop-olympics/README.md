# Chainlink External Adapter for Nop-olympics

The Node Operator Olympics is mock EA to be used for the NOP Operator Olympics. It makes a request to a mock data provider and returns
a fake price.

### Environment Variables

| Required? |     Name     |              Description               | Options | Defaults to |
| :-------: | :----------: | :------------------------------------: | :-----: | :---------: |
|    ✅     | API_ENDPOINT | The API endpoint for the data provider |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |             Options             | Defaults to |
| :-------: | :------: | :-----------------: | :-----------------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Nop-olympics-Endpoint) |    price    |

---

## Nop-olympics Endpoint

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
