# Chainlink External Adapter for FCS API

![1.2.37](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/fcsapi/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://fcsapi.com/api-v3/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   | Description |  Type  | Options | Default |
| :-------: | :-----: | :---------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY |             | string |         |         |

---

## Data Provider Rate Limits

|   Name    | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |            Note             |
| :-------: | :-------------------------: | :-------------------------: | :-----------------------: | :-------------------------: |
|   free    |                             |                             |          6.8493           | only mentions monthly limit |
|   basic   |                             |                             |           13.69           |                             |
| standard  |                             |                             |          68.493           |                             |
|    pro    |                             |                             |          164.38           |                             |
|  proplus  |                             |                             |          684.93           |                             |
| corporate |                             |                             |          1369.86          |                             |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                     Options                                      | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [common](#common-endpoint), [forex](#common-endpoint), [stock](#common-endpoint) | `common` |

## Common Endpoint

Supported names for this endpoint are: `common`, `forex`, `stock`.

### Input Params

| Required? | Name |     Aliases     | Description  |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-------------: | :----------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `from` | The base key | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "FTSE",
    "endpoint": "common"
  },
  "debug": {
    "cacheKey": "jelFIe/k15MwK3X4Yy3kNjs5GbQ="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 7274.81
  },
  "result": 7274.81,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
