# Chainlink External Adapter for MyCryptoApi

![1.2.34](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/mycryptoapi/package.json)

Base URL https://gas.mycryptoapi.com/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [gasprice](#gasprice-endpoint) | `gasprice` |

## Gasprice Endpoint

`gasprice` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |    Description    |  Type  |                 Options                  | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :---------------: | :----: | :--------------------------------------: | :-----: | :--------: | :------------: |
|           | speed |         | The desired speed | string | `fast`, `fastest`, `safeLow`, `standard` | `fast`  |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "gasprice",
    "speed": "fast"
  },
  "debug": {
    "cacheKey": "0BJQ6WrEaARtjkqLfBrRVKG+QcE="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "safeLow": 122,
    "standard": 134,
    "fast": 148,
    "fastest": 160,
    "blockNum": 13722866,
    "result": 148
  },
  "result": 148,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
