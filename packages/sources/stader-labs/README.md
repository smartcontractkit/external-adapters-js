# Chainlink External Adapter for Stader Labs

![1.0.7](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/stader-labs/package.json)

By default fetches the value of MaticX/USD

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |   Description   |  Type  | Options | Default |
| :-------: | :-------------: | :-------------: | :----: | :-----: | :-----: |
|           | POLYGON_RPC_URL | Polygon RPC URL | string |         |         |
|           | FANTOM_RPC_URL  | Fantom RPC URL  | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                       Options                        | Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [maticx](#maticx-endpoint), [sftmx](#sftmx-endpoint) | `maticx` |

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
  "data": {
    "endpoint": "maticx"
  },
  "debug": {
    "cacheKey": "Q3XCND2iB5CU/2lKGBCT16/dPq0="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 47732197
  },
  "result": 47732197,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Sftmx Endpoint

sFTMx token price in USD.

`sftmx` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "sftmx"
  },
  "debug": {
    "cacheKey": "xJ+iPjUW3lBOVvhun6x6eoNkNhY="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 26263763
  },
  "result": 26263763,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
