# Chainlink External Adapter for Upvest

### Input Parameters

| Required? |   Name   |     Description     |            Options             | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------: | :---------: |
|           | endpoint | The endpoint to use | [gasprice](#gasprice-Endpoint) | `gasprice`  |

---

## Gas Price Endpoint

### Input Params

| Required? |  Name   |    Description    |             Options              | Defaults to |
| :-------: | :-----: | :---------------: | :------------------------------: | :---------: |
|    🟡     | `speed` | The desired speed | `slow`,`medium`,`fast`,`fastest` |   `fast`    |

### Output Format

```json
{
  "jobRunID": "1",
  "result": 33,
  "statusCode": 200,
  "data": {
    "result": 33
  }
}
```
