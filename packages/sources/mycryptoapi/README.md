# Chainlink External Adapter for MyCryptoApi

Version: 1.2.1

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
|           | speed |         | The desired speed | string | `safeLow`, `standard`, `fast`, `fastest` | `fast`  |            |                |

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
  "safeLow": 122,
  "standard": 134,
  "fast": 148,
  "fastest": 160,
  "blockNum": 13722866,
  "result": 148
}
```
