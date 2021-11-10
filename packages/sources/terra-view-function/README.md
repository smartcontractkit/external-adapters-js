# Chainlink External Adapter for querying Terra view functions

This external adapter allows querying contracts on the Terra blockchain.

### Environment Variables

| Required? |   Name   |            Description            | Options | Defaults to |
| :-------: | :------: | :-------------------------------: | :-----: | :---------: |
|    ✅     | RPC_URL  |       The RPC URL to query        |         |             |
|    ✅     | CHAIN_ID | Which chain ID it's connecting to |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |        Options         | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------: | :---------: |
|           | endpoint | The endpoint to use | [view](#View-Endpoint) |    view     |

---

## View Endpoint

### Input Params

| Required? |          Name           |                  Description                   | Options | Defaults to |
| :-------: | :---------------------: | :--------------------------------------------: | :-----: | :---------: |
|    ✅     | `address` or `contract` |              The address to query              |         |             |
|    ✅     |         `query`         |                The query object                |         |             |
|           |        `params`         | Optional params object to include in the query |         |             |

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "address": "terra1dw5ex5g802vgrek3nzppwt29tfzlpa38ep97qy",
    "query": { "aggregator_query": { "get_latest_round_data": {} } }
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": {
    "round_id": 102560,
    "answer": "455045076819",
    "started_at": 1635942792,
    "updated_at": 1635942797,
    "answered_in_round": 102560
  },
  "statusCode": 200,
  "data": {
    "result": {
      "round_id": 102560,
      "answer": "455045076819",
      "started_at": 1635942792,
      "updated_at": 1635942797,
      "answered_in_round": 102560
    }
  }
}
```
