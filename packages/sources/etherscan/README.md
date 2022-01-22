# Chainlink External Adapter for EtherScan

### Environment Variables

| Required? |  Name   |                            Description                            | Options | Defaults to |
| :-------: | :-----: | :---------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained [here](https://etherscan.io/apis) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |            Options             | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------: | :---------: |
|           | endpoint | The endpoint to use | [gasprice](#gasprice-Endpoint) | `gasprice`  |

---

## Gas Price Endpoint

### Input Params

| Required? |  Name   |    Description    |        Options         | Defaults to |
| :-------: | :-----: | :---------------: | :--------------------: | :---------: |
|    🟡     | `speed` | The desired speed | `safe`,`medium`,`fast` |   `fast`    |

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
