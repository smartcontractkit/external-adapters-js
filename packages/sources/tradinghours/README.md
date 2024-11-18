# TRADINGHOURS

![0.1.7](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tradinghours/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description            |  Type  | Options |            Default             |
| :-------: | :----------: | :-------------------------------: | :----: | :-----: | :----------------------------: |
|           | API_ENDPOINT | Base URL for the TradingHours API | string |         | `https://api.tradinghours.com` |
|    ✅     |   API_KEY    | API key for the TradingHours API  | string |         |                                |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |              1              |                             |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                         Options                                                                                         |     Default     |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-------------: |
|           | endpoint | The endpoint to use | string | [forex-market-status](#market-status-endpoint), [market-status](#market-status-endpoint), [metals-market-status](#market-status-endpoint), [wti-market-status](#market-status-endpoint) | `market-status` |

## Market-status Endpoint

Supported names for this endpoint are: `forex-market-status`, `market-status`, `metals-market-status`, `wti-market-status`.

### Input Params

| Required? |  Name  | Aliases |      Description       |  Type  |         Options          | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :--------------------: | :----: | :----------------------: | :-----: | :--------: | :------------: |
|    ✅     | market |         | The name of the market | string | `forex`, `metals`, `wti` |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
