# Chainlink External Adapter for Orchid bandwidth

Version: 1.1.23

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |             Default              |
| :-------: | :----------: | :---------: | :----: | :-----: | :------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://chainlink.orchid.com/0` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |             Options              |   Default   |
| :-------: | :------: | :-----------------: | :----: | :------------------------------: | :---------: |
|           | endpoint | The endpoint to use | string | [bandwidth](#bandwidth-endpoint) | `bandwidth` |

---

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
