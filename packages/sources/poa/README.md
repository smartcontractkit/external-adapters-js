# Chainlink External Adapter for POA Network gas price

Version: 1.2.23

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |             Default             |
| :-------: | :----------: | :---------: | :----: | :-----: | :-----------------------------: |
|           | API_ENDPOINT |             | string |         | `https://gasprice.poa.network/` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [gasprice](#gasprice-endpoint) | `gasprice` |

---

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
    "endpoint": "gasprice",
    "speed": "average"
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
