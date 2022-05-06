# Chainlink External Adapter for Etherchain

![1.2.31](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/etherchain/package.json)

Base URL https://www.etherchain.org

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |           Default            |
| :-------: | :----------: | :---------: | :----: | :-----: | :--------------------------: |
|           | API_ENDPOINT |             | string |         | `https://www.etherchain.org` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [gasprice](#gasprice-endpoint) | `gasprice` |

## Gasprice Endpoint

`gasprice` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |    Description    |  Type  |                 Options                  |  Default   | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :---------------: | :----: | :--------------------------------------: | :--------: | :--------: | :------------: |
|           | speed |         | The desired speed | string | `fast`, `fastest`, `safeLow`, `standard` | `standard` |            |                |

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
    "safeLow": 1,
    "standard": 1,
    "fast": 1.5,
    "fastest": 2,
    "currentBaseFee": 126.6,
    "recommendedBaseFee": 257,
    "result": 1500000000
  },
  "result": 1500000000,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
