# Chainlink External Adapter for Stader Labs

![3.0.14](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/stader-labs/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

By default fetches the value of MaticX/USD

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name       |           Description           |  Type  | Options | Default |
| :-------: | :--------------: | :-----------------------------: | :----: | :-----: | :-----: |
|           | POLYGON_RPC_URL  |         Polygon RPC URL         | string |         |         |
|           | POLYGON_CHAIN_ID |   The chain id to connect to    | string |         |  `137`  |
|           |  FANTOM_RPC_URL  |         Fantom RPC URL          | string |         |         |
|           | FANTOM_CHAIN_ID  | The blockchain id to connect to | string |         |  `250`  |
|           |   BSC_RPC_URL    |           BSC RPC URL           | string |         |         |
|           |   BSC_CHAIN_ID   | The blockchain id to connect to | string |         |  `56`   |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                   Options                                    | Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [bnbx](#bnbx-endpoint), [maticx](#maticx-endpoint), [sftmx](#sftmx-endpoint) | `maticx` |

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

## Bnbx Endpoint

BNBx token price in USD.

`bnbx` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "bnbx"
  },
  "debug": {
    "cacheKey": "B4CBC4FYyPZBSbz59588HqQe+TU="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 28917028197
  },
  "result": 28917028197,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
