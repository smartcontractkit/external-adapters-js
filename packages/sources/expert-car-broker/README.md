# Chainlink External Adapter for Expert Car Broker

Adapter to get data from Expert Car Broker.

### Environment Variables

| Required? |  Name   |                                                        Description                                                         | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|     ✅     | API_KEY | An API key that can be obtained from the data provider |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|           | endpoint | The endpoint to use | [feed](#Feed-Endpoint) |   feed   |

---

## Feed Endpoint

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `product`  |   The product to query    | |             |
|    ✅     | `feedId` | The feed ID to use | |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "product": "ferrari-f12tdf",
    "feedId": 1
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "value": 77777.77,
    "result": 77777.77
  },
  "statusCode": 200
}
```
