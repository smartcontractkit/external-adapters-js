# Chainlink External Adapter for MyCryptoApi

Version: 1.2.17

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [gasprice](#gasprice-endpoint) | `gasprice` |

---

## Gasprice Endpoint

`gasprice` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |    Description    |  Type  |                 Options                  | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :---------------: | :----: | :--------------------------------------: | :-----: | :--------: | :------------: |
|           | speed |         | The desired speed | string | `fast`, `fastest`, `safeLow`, `standard` | `fast`  |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "gasprice",
    "speed": "fast"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "safeLow": 122,
    "standard": 134,
    "fast": 148,
    "fastest": 160,
    "blockNum": 13722866,
    "result": 148
  },
  "result": 148,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
