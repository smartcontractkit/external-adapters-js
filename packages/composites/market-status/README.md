# MARKET_STATUS

![1.2.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/market-status/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |           Name           |                                        Description                                        |  Type  | Options | Default |
| :-------: | :----------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | TRADINGHOURS_ADAPTER_URL |                              URL of the TradingHours adapter                              | string |         |         |
|    ✅     |     NCFX_ADAPTER_URL     |                                  URL of the NCFX adapter                                  | string |         |         |
|           |  BACKGROUND_EXECUTE_MS   | The amount of time the background execute should sleep before performing the next request | number |         | `1000`  |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                 Options                  |     Default     |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------: | :-------------: |
|           | endpoint | The endpoint to use | string | [market-status](#market-status-endpoint) | `market-status` |

## Market-status Endpoint

`market-status` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |      Description       |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :--------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market |         | The name of the market | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
