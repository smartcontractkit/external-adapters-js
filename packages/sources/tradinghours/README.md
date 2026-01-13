# TRADINGHOURS

![0.5.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tradinghours/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

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

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                                                                                                                                         Options                                                                                                                                                                                                                                                                          |     Default     |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-------------: |
|           | endpoint | The endpoint to use | string | [euronext_milan-market-status](#market-status-endpoint), [euronext_paris-market-status](#market-status-endpoint), [forex-market-status](#market-status-endpoint), [lse-market-status](#market-status-endpoint), [market-status](#market-status-endpoint), [metals-market-status](#market-status-endpoint), [nyse-market-status](#market-status-endpoint), [six-market-status](#market-status-endpoint), [tradegate-market-status](#market-status-endpoint), [wti-market-status](#market-status-endpoint), [xetra-market-status](#market-status-endpoint) | `market-status` |

## Market-status Endpoint

Supported names for this endpoint are: `euronext_milan-market-status`, `euronext_paris-market-status`, `forex-market-status`, `lse-market-status`, `market-status`, `metals-market-status`, `nyse-market-status`, `six-market-status`, `tradegate-market-status`, `wti-market-status`, `xetra-market-status`.

### Input Params

| Required? |  Name   | Aliases |                                     Description                                     |  Type  |                                                                                                      Options                                                                                                       |  Default  | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :---------------------------------------------------------------------------------: | :----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-------: | :--------: | :------------: |
|    ✅     | market  |         |                               The name of the market                                | string | `EURONEXT_MILAN`, `EURONEXT_PARIS`, `FOREX`, `LSE`, `METALS`, `NYSE`, `SIX`, `TRADEGATE`, `WTI`, `XETRA`, `euronext_milan`, `euronext_paris`, `forex`, `lse`, `metals`, `nyse`, `six`, `tradegate`, `wti`, `xetra` |           |            |                |
|           |  type   |         |                              Type of the market status                              | string |                                                                                                 `24/5`, `regular`                                                                                                  | `regular` |            |                |
|           | weekend |         | DHH-DHH:TZ, 520-020:America/New_York means Fri 20:00 to Sun 20:00 Eastern Time Zone | string |                                                                                                                                                                                                                    |           |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
