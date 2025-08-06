# COINMETRICS_LWBA

![2.0.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinmetrics-lwba/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |            Description            |  Type  | Options |            Default            |
| :-------: | :-------------: | :-------------------------------: | :----: | :-----: | :---------------------------: |
|    ✅     |     API_KEY     |      The coinmetrics API key      | string |         |                               |
|           | WS_API_ENDPOINT | The websocket url for coinmetrics | string |         | `wss://api.coinmetrics.io/v4` |
|           |  API_ENDPOINT   |          Unused in LWBA           | string |         |                               |
|           |      NAME       |                                   |        |         |                               |

---

## Data Provider Rate Limits

|   Name    | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-------: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| community |                             |             100             |                           |      |
|   paid    |             300             |                             |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                     Options                                                                                      |    Default    |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------: |
|           | endpoint | The endpoint to use | string | [crypto-lwba](#crypto-lwba-endpoint), [crypto](#crypto-lwba-endpoint), [crypto_lwba](#crypto-lwba-endpoint), [cryptolwba](#crypto-lwba-endpoint), [price](#crypto-lwba-endpoint) | `crypto-lwba` |

## Crypto-lwba Endpoint

Supported names for this endpoint are: `crypto`, `crypto-lwba`, `crypto_lwba`, `cryptolwba`, `price`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "crypto-lwba",
    "base": "ETH",
    "quote": "USD"
  }
}
```

---

MIT License
