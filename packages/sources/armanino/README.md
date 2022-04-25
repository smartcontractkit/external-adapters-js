# Armanino Adapter

![1.0.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/armanino/package.json)

Carbon credit reserves attested by Armanino

Base URL https://api.real-time-attest.trustexplorer.io/chainlink

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                      Options                      | Default |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [balance](#mco2-endpoint), [mco2](#mco2-endpoint) | `mco2`  |

## Mco2 Endpoint

Supported names for this endpoint are: `balance`, `mco2`.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "mco2",
    "resultPath": "totalMCO2"
  },
  "debug": {
    "cacheKey": "jma96ZQNYh/skkagk8dl7s6liBk="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "totalMCO2": 3041044,
    "totalCarbonCredits": 3041044,
    "timestamp": "2022-04-04T11:00:46.577Z",
    "result": 3041044
  },
  "result": 3041044,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
