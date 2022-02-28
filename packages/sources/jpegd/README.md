# Chainlink External Adapter for JPEG'd

Version: 1.0.6

This adapter allows for querying NFT collection values

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |  Name   |              Description               |  Type  | Options | Default |
| :-------: | :-----: | :------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key provided by the JPEG'd team | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [punks](#punks-endpoint) | `punks` |

---

## Punks Endpoint

`punks` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |          Aliases          |                       Description                       |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :-----------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | block | `blockNum`, `blockNumber` | The block number for which information is being queried | number |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "punks",
    "block": 14000000
  },
  "rateLimitMaxAge": 5555
}
```

Response:

```json
{
  "success": true,
  "block": 14000000,
  "value": 14000000,
  "result": 14000000
}
```

---
