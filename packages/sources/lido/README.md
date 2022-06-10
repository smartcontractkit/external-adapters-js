# Chainlink External Adapter for Lido

![1.0.4](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/lido/package.json)

By default fetches the value of stMATIC/USD

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |   Description   |  Type  | Options | Default |
| :-------: | :-------------: | :-------------: | :----: | :-----: | :-----: |
|    ✅     | POLYGON_RPC_URL | Polygon RPC URL | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [stmatic](#stmatic-endpoint) | `stmatic` |

## Stmatic Endpoint

stMATIC token price in USD.

`stmatic` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "stmatic"
  },
  "debug": {
    "cacheKey": "5bw+9BVRUWe1yPyws7E5OJiSTK8="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 69357317
  },
  "result": 69357317,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
