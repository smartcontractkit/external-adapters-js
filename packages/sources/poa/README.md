# Chainlink External Adapter for POA Network gas price

![1.3.32](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/poa/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://gasprice.poa.network/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |             Default             |
| :-------: | :----------: | :---------: | :----: | :-----: | :-----------------------------: |
|           | API_ENDPOINT |             | string |         | `https://gasprice.poa.network/` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [gasprice](#gasprice-endpoint) | `gasprice` |

## Gasprice Endpoint

`gasprice` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |    Description    |  Type  |          Options          |  Default  | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :---------------: | :----: | :-----------------------: | :-------: | :--------: | :------------: |
|           | speed |         | The desired speed | string | `average`, `fast`, `slow` | `average` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "speed": "average",
    "endpoint": "gasprice"
  },
  "debug": {
    "cacheKey": "1GHxqDIBX4s/n/jRmjOhhARCCIE="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "average": 152.5,
    "fast": 174.5,
    "slow": 139.4,
    "result": 152500000000
  },
  "result": 152500000000,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
