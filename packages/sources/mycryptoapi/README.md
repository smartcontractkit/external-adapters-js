# Chainlink External Adapter for MyCryptoApi

### Input Parameters

| Required? |   Name   |     Description     |            Options             | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------: | :---------: |
|           | endpoint | The endpoint to use | [gasprice](#gasprice-Endpoint) | `gasprice`  |

---

## Gas Price Endpoint

### Input Params

| Required? |  Name   |    Description    |                Options                | Defaults to |
| :-------: | :-----: | :---------------: | :-----------------------------------: | :---------: |
|    🟡     | `speed` | The desired speed | `safeLow`,`standard`,`fast`,`fastest` |   `fast`    |

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

### Verbose Output Format

```json
{
  "jobRunID": "1",
  "result": 59,
  "statusCode": 200,
  "data": {
    "safeLow": 47,
    "standard": 52,
    "fast": 59,
    "fastest": 69,
    "blockNum": 13063324,
    "result": 59
  }
}
```
