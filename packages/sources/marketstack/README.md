# Chainlink External Adapter for Marketstack

![1.3.35](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/marketstack/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL http://api.marketstack.com/v1/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |             Default              |
| :-------: | :----------: | :---------: | :----: | :-----: | :------------------------------: |
|    ✅     |   API_KEY    |             | string |         |                                  |
|           | API_ENDPOINT |             | string |         | `http://api.marketstack.com/v1/` |

---

## Data Provider Rate Limits

|     Name     | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |            Note             |
| :----------: | :-------------------------: | :-------------------------: | :-----------------------: | :-------------------------: |
|     free     |                             |                             |           1.369           | only mentions monthly limit |
|    basic     |                             |                             |           13.69           |                             |
| professional |                             |                             |           136.9           |                             |
|   business   |                             |                             |          684.93           |                             |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                     Options                      | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [eod](#stock-endpoint), [stock](#stock-endpoint) | `stock` |

## Stock Endpoint

**NOTE: the `eod` endpoint is temporarily still supported, however, is being deprecated. Please use the `stock` endpoint instead.**

Supported names for this endpoint are: `eod`, `stock`.

### Input Params

| Required? |   Name   |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base   | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|           | interval |                | The symbol of the currency to convert to | string |         | `1min`  |            |                |
|           |  limit   |                |     The limit for number of results      | number |         |   `1`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "AAPL",
    "interval": "1min",
    "limit": 1,
    "endpoint": "stock"
  },
  "debug": {
    "cacheKey": "08JBbsORZVWHP8RjhjYY1wlcurQ="
  },
  "rateLimitMaxAge": 2921840
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 164.77
  },
  "result": 164.77,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
