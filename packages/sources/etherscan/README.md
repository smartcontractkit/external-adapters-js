# Chainlink External Adapter for EtherScan

![1.3.32](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/etherscan/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.etherscan.io

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |                            Description                            |  Type  | Options |          Default           |
| :-------: | :-----: | :---------------------------------------------------------------: | :----: | :-----: | :------------------------: |
|    ✅     | API_KEY | An API key that can be obtained [here](https://etherscan.io/apis) | string |         | `https://api.etherscan.io` |

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

| Required? | Name  | Aliases |    Description    |  Type  |         Options          | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :---------------: | :----: | :----------------------: | :-----: | :--------: | :------------: |
|           | speed |         | The desired speed | string | `fast`, `medium`, `safe` | `fast`  |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "speed": "fast",
    "endpoint": "gasprice"
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
    "status": "1",
    "message": "OK",
    "result": 128
  },
  "result": 128,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
