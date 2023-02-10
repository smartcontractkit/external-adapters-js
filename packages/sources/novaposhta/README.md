# NovaPoshta Adapter

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/novaposhta/package.json)

NovaPoshta Adapter for tracking parcels

Base URL https://api.novaposhta.ua/v2.0/json/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [tracking](#tracking-endpoint) | `tracking` |

## Tracking Endpoint

Get shipment status by tracking number (https://developers.novaposhta.ua).

`tracking` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |                           Aliases                           |        Description         |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :---------------------------------------------------------: | :------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | number | `get`, `track`, `trackNumber`, `tracking`, `trackingNumber` | Tracking number NovaPoshta | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "number": "59000869676636",
    "endpoint": "tracking",
    "resultPath": "data.0.StatusCode"
  },
  "debug": {
    "cacheKey": "YlIuM3Kq/HTtAAjhL1JIjjOPXSo="
  },
  "rateLimitMaxAge": 11
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "data": [
      {
        "StatusCode": "3"
      }
    ],
    "result": 3
  },
  "result": 3,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
