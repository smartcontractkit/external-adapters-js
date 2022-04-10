# Armanino Adapter

Version: 1.0.0

Carbon credit reserves attested by Armanino

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                      Options                      | Default |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [balance](#mc02-endpoint), [mc02](#mc02-endpoint) | `mc02`  |

---

## Mc02 Endpoint

Supported names for this endpoint are: `balance`, `mc02`.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "mc02",
    "resultPath": "totalMCO2"
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
