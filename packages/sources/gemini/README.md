# Chainlink External Adapter for Gemini

Version: 2.1.17

An external adapter to get data from Gemini

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |         Default          |
| :-------: | :----------: | :---------: | :----: | :-----: | :----------------------: |
|           | API_ENDPOINT |             | string |         | `https://api.gemini.com` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [reserves](#reserves-endpoint) | `reserves` |

---

## Reserves Endpoint

`reserves` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   |     Aliases     |                       Description                        |  Type  | Options |  Default   | Depends On | Not Valid With |
| :-------: | :-----: | :-------------: | :------------------------------------------------------: | :----: | :-----: | :--------: | :--------: | :------------: |
|    ✅     |  token  | `asset`, `coin` |             The symbol of the token to query             | string |         |   `EFIL`   |            |                |
|           | chainId |                 | An identifier for which network of the blockchain to use | string |         | `mainnet`  |            |                |
|           | network |                 |                                                          | string |         | `filecoin` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "reserves",
    "token": "EFIL",
    "chainId": "mainnet",
    "network": "filecoin"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "addresses": [
      "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi",
      "f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay"
    ],
    "ethereum_supply": 33427.594125,
    "currency": "EFIL",
    "result": [
      {
        "address": "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi",
        "network": "filecoin",
        "chainId": "mainnet"
      },
      {
        "address": "f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay",
        "network": "filecoin",
        "chainId": "mainnet"
      }
    ]
  },
  "result": [
    {
      "address": "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi",
      "network": "filecoin",
      "chainId": "mainnet"
    },
    {
      "address": "f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay",
      "network": "filecoin",
      "chainId": "mainnet"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
