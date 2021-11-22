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

| Required? |            Name             |                       Description                        | Options | Defaults to |
| :-------: | :-------------------------: | :------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `token`, `asset`, or `coin` |             The symbol of the token to query             | `EFIL`  |             |
|           |          `chainId`          | An identifier for which network of the blockchain to use |         |  `mainnet`  |
|           |          `network`          |                                                          |         | `ethereum`  |

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
    {
      "address": "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi",
      "chainId": "mainnet",
      "network": "ethereum"
    },
    {
      "address": "f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay",
      "chainId": "mainnet",
      "network": "ethereum"
    }
  ],
  "statusCode": 200,
  "data": {
    "result": [
      {
        "address": "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi",
        "chainId": "mainnet",
        "network": "ethereum"
      },
      {
        "address": "f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay",
        "chainId": "mainnet",
        "network": "ethereum"
      }
    ]
  }
}
```
