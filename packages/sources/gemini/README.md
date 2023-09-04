# GEMINI

![3.0.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/gemini/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |      Description       |  Type  | Options |         Default          |
| :-------: | :----------: | :--------------------: | :----: | :-----: | :----------------------: |
|           | API_ENDPOINT | API endpoint of gemini | string |         | `https://api.gemini.com` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                           Note                           |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------: |
| default |                             |              6              |                           | Considered unlimited tier, but setting reasonable limits |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [reserves](#reserves-endpoint) | `reserves` |

## Reserves Endpoint

`reserves` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   |     Aliases     |                       Description                        |  Type  | Options |  Default   | Depends On | Not Valid With |
| :-------: | :-----: | :-------------: | :------------------------------------------------------: | :----: | :-----: | :--------: | :--------: | :------------: |
|           |  token  | `asset`, `coin` |             The symbol of the token to query             | string |         |   `EFIL`   |            |                |
|           | chainId |                 | An identifier for which network of the blockchain to use | string |         | `mainnet`  |            |                |
|           | network |                 |         The name of the target network protocol          | string |         | `filecoin` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "token": "EFIL",
    "chainId": "mainnet",
    "network": "filecoin",
    "endpoint": "reserves"
  },
  "debug": {
    "cacheKey": "AeB8DrMgHWj63Dzq1Lv1k7MaCyE="
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

MIT License
