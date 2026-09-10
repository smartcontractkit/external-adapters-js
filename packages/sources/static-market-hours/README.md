# STATIC_MARKET_HOURS

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/static-market-hours/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |              Name              |                                              Description                                               |  Type   | Options | Default |
| :-------: | :----------------------------: | :----------------------------------------------------------------------------------------------------: | :-----: | :-----: | :-----: |
|    ✅     |  ${MARKET}\_REGULAR_SCHEDULE   |           JSON encoded schedule data for ${MARKET} which is specified in the input parameter           | string  |         |         |
|    ✅     |    ${MARKET}\_24_5_SCHEDULE    | JSON encoded schedule data for ${MARKET} which is specified in the input parameter, when type = "24/5" | string  |         |         |
|           | ALLOW_AT_TIMESTAMP_FOR_TESTING |                Enables support for the atTimestampSeconds input parameter for testing.                 | boolean |         | `false` |

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

| Required? |         Name         | Aliases |                                     Description                                      |  Type   |      Options      |  Default  | Depends On | Not Valid With |
| :-------: | :------------------: | :-----: | :----------------------------------------------------------------------------------: | :-----: | :---------------: | :-------: | :--------: | :------------: |
|    ✅     |        market        |         |                                The name of the market                                | string  |                   |           |            |                |
|           |         type         |         |                              Type of the market status                               | string  | `24/5`, `regular` | `regular` |            |                |
|           |       weekend        |         | DHH-DHH:TZ, 520-020:America/New_York means Fri 20:00 to Sun 20:00 Eastern Time Zone  | string  |                   |           |            |                |
|           | force245MarketStatus |         |                        Return response in 24/5 market status                         | boolean |                   |           |            |                |
|           |  atTimestampSeconds  |         | Optional override for the current time in seconds since the epoch. Used for testing. | number  |                   |           |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
