# Chainlink External Adapter for Stasis

Version: 1.1.24

Stasis adapter to get Circulating Supply of EURS

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [supply](#supply-endpoint) | `supply` |

---

## Supply Endpoint

`supply` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {}
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
