# Chainlink External Adapter for Etherchain

### Input Parameters

| Required? |   Name   |     Description     |            Options             | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------: | :---------: |
|           | endpoint | The endpoint to use | [gasprice](#gasprice-Endpoint) | `gasprice`  |

---

## Gas Price Endpoint

### Input Params

| Required? |  Name   |    Description    |               Options                | Defaults to |
| :-------: | :-----: | :---------------: | :----------------------------------: | :---------: |
|    🟡     | `speed` | The desired speed | `safeLow`,`average`,`fast`,`fastest` |  `average`  |

### Output Format

```json
{
  "jobRunID": "1",
  "data": {
    "safeLow": "7.0",
    "standard": "8.3",
    "fast": "13.0",
    "fastest": "15.0",
    "result": 13000000000
  },
  "result": 13000000000,
  "statusCode": 200
}
```
