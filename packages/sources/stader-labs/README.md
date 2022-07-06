# Chainlink External Adapter for Stader Labs

![0.2.4](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/stader-labs/package.json)

By default fetches the value of MaticX/USD

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |   Description   |  Type  | Options | Default |
| :-------: | :-------------: | :-------------: | :----: | :-----: | :-----: |
|    ✅     | POLYGON_RPC_URL | Polygon RPC URL | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [maticx](#maticx-endpoint) | `maticx` |

## Maticx Endpoint

MaticX token price in USD.

`maticx` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {},
  "debug": {
    "cacheKey": "2jmj7l5rSw0yVb/vlWAYkK/YBwk="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 53425095
  },
  "result": 53425095,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
