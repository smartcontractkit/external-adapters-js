# Chainlink External Adapter for TrueUSD

Version: 1.1.1

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |                       Default                        |
| :-------: | :----------: | :---------: | :----: | :-----: | :--------------------------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://core-api.real-time-attest.trustexplorer.io` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [trueusd](#trueusd-endpoint) | `trueusd` |

---

## Trueusd Endpoint

`trueusd` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    | Aliases |                     Description                     |  Type  |          Options           |   Default    | Depends On | Not Valid With |
| :-------: | :--------: | :-----: | :-------------------------------------------------: | :----: | :------------------------: | :----------: | :--------: | :------------: |
|           | resultPath |         | The data point to return from the API response data | string | `totalTrust`, `totalToken` | `totalTrust` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "field": "totalTrust"
  }
}
```

Response:

```json
{
  "responseData": {
    "accountName": "TrueUSD",
    "totalTrust": 1256102560.69,
    "totalToken": 1250717352.7853243,
    "updatedAt": "2021-11-08T13:49:45.112Z",
    "token": [
      {
        "tokenName": "TUSDB (BNB)",
        "principle": 617032.83532437
      },
      {
        "tokenName": "TUSD (TRON)",
        "principle": 269206919.78
      },
      {
        "tokenName": "TUSD (ETH)",
        "principle": 980893400.1700001
      },
      {
        "tokenName": "TUSD (AVA)",
        "principle": 0
      }
    ]
  },
  "message": [
    {
      "msg": "get contractSupply successfully"
    }
  ],
  "success": true,
  "responseCode": 200,
  "result": 1256102560.69
}
```
