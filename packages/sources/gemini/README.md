# Chainlink External Adapter for Gemini

An external adapter to get data from Gemini

### Environment Variables

This adapter takes no environment variables.

---

### Input Parameters

| Required? |   Name   |     Description     |            Options             | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------: | :---------: |
|           | endpoint | The endpoint to use | [reserves](#Reserves-Endpoint) |  reserves   |

---

## Reserves Endpoint

### Input Params

| Required? |            Name             |           Description            | Options | Defaults to |
| :-------: | :-------------------------: | :------------------------------: | :-----: | :---------: |
|    ✅     | `token`, `asset`, or `coin` | The symbol of the token to query | `EFIL`  |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "token": "EFIL"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": [
    "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi",
    "f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay"
  ],
  "statusCode": 200,
  "data": {
    "addresses": [
      "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi",
      "f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay"
    ],
    "ethereum_supply": 33427.594125,
    "currency": "EFIL",
    "result": [
      "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi",
      "f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay"
    ]
  }
}
```
