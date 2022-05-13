# Chainlink External Adapter for Orchid bandwidth

![1.1.34](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/orchid-bandwidth/package.json)

Base URL https://chainlink.orchid.com/0

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |             Default              |
| :-------: | :----------: | :---------: | :----: | :-----: | :------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://chainlink.orchid.com/0` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |             Options              |   Default   |
| :-------: | :------: | :-----------------: | :----: | :------------------------------: | :---------: |
|           | endpoint | The endpoint to use | string | [bandwidth](#bandwidth-endpoint) | `bandwidth` |

## Bandwidth Endpoint

`bandwidth` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "bandwidth"
  },
  "debug": {
    "cacheKey": "zD1CVzYDfKCoq1MFoQZlCuGFIW0="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": 0.06491712005868808,
    "result": 0.06491712005868808
  },
  "result": 0.06491712005868808,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
