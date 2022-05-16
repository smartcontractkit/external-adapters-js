# Chainlink External Adapter for Stasis

![1.1.35](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/stasis/package.json)

Stasis adapter to get Circulating Supply of EURS

Base URL https://stasis.net

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [supply](#supply-endpoint) | `supply` |

## Supply Endpoint

`supply` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {},
  "debug": {
    "cacheKey": "6fd5ecf807136e36fbc5392ff2d04b29539b3be4"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 117769329.88
  },
  "result": 117769329.88,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
