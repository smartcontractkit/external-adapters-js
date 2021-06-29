# Chainlink External Adapter for TrueUSD

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|           | endpoint | The endpoint to use | [trueusd](#TrueUSD-Endpoint) |  `trueusd`  |

---

## TrueUSD Endpoint

https://core-api.real-time-attest.trustexplorer.io/trusttoken/TrueUSD

### Input Params

| Required? |  Name   |                     Description                     |          Options           | Defaults to  |
| :-------: | :-----: | :-------------------------------------------------: | :------------------------: | :----------: |
|           | `field` | The data point to return from the API response data | `totalTrust`, `totalToken` | `totalTrust` |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "field": "totalToken"
  }
}
```

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "responseData": {
      "accountName": "TrueUSD",
      "totalTrust": 347215038.53,
      "totalToken": 343465335.4587567,
      "updatedAt": "2020-10-16T22:02:31.560Z",
      "token": [
        { "tokenName": "TUSDB", "principle": 4766109.0487567 },
        { "tokenName": "TUSD", "principle": 338699226.40999997 }
      ]
    },
    "message": [{ "msg": "get contractSupply successfully" }],
    "success": true,
    "responseCode": 200,
    "result": 343465335.4587567
  },
  "result": 343465335.4587567,
  "statusCode": 200
}
```
