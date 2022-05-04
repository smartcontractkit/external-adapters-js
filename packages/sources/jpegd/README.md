# Chainlink External Adapter for JPEG'd

![1.1.13](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/jpegd/package.json)

Query NFT collection values from the JPEG'd API.

Base URL https://jpegapi.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |              Description               |  Type  | Options | Default |
| :-------: | :-----: | :------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key provided by the JPEG'd team | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [punks](#punks-endpoint) | `punks` |

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
    "block": 10000000
  },
  "debug": {
    "cacheKey": "MJRDg3InuoFr8aNxF6EjmWVVPOU="
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
    "block": 11000000,
    "value": 5.568735828488373,
    "result": 5.568735828488373
  },
  "result": 5.568735828488373,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
