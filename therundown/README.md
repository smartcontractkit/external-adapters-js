# Chainlink External Adapter for TheRundown

### Environment Variables

| Required? |  Name   |                                         Description                                         | Options | Defaults to |
| :-------: | :-----: | :-----------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://rapidapi.com/therundown/api/therundown) |         |             |

### Input Parameters

| Required? |   Name   |     Description     |               Options                | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [total-score](#Total-Score-Endpoint) | total-score |

---

## Total Score Endpoint

Returns the sum of both teams' scores for a match (match status must be final)

### Input Params

| Required? |   Name    |         Description          | Options | Defaults to |
| :-------: | :-------: | :--------------------------: | :-----: | :---------: |
|    ✅     | `matchId` | The ID of the match to query |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "matchId": "5527455bb80a5e9884153786aeb5f2b2"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "result": 30
  },
  "result": 30,
  "statusCode": 200
}
```
