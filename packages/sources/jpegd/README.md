# Chainlink External Adapter for JPEG'd

![2.0.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/jpegd/package.json)

This adapter allows for querying NFT collection values

Base URL https://jpegapi.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |              Description               |  Type  | Options | Default |
| :-------: | :-----: | :------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key provided by the JPEG'd team | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                            Options                             | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [collections](#collections-endpoint), [punks](#punks-endpoint) | `punks` |

## Punks Endpoint

Queries JPEG'd API for the value of a floor Cryptopunk at the requested block.

`punks` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |          Aliases          |                       Description                       | Type | Options | Default  | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :-----------------------------------------------------: | :--: | :-----: | :------: | :--------: | :------------: |
|           | block | `blockNum`, `blockNumber` | The block number for which information is being queried |      |         | `latest` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "punks",
    "block": 14000000
  },
  "debug": {
    "cacheKey": "PvrAVfL2Y0xJVTWwBXhNjo/cES0="
  },
  "rateLimitMaxAge": 5555
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "block": 14000000,
    "value": 14000000,
    "result": 14000000
  },
  "result": 14000000,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Collections Endpoint

`collections` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    | Aliases |                    Description                     |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------: | :-----: | :------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | collection |         | The Opensea slug of the collection being requested | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "collections",
    "collection": "jpeg-cards"
  },
  "debug": {
    "cacheKey": "dM2Oy9A0fH8AvAgwbP9dYa2IxNk="
  },
  "rateLimitMaxAge": 11111
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "block": 14000000,
    "value": 69000000,
    "result": 69000000
  },
  "result": 69000000,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
