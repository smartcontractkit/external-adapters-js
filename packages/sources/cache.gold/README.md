# Chainlink External Adapter for Cache.gold

Version: 1.2.16

Query the total gold grams locked in [cache.gold](https://contract.cache.gold/api/lockedGold)

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |              Options               |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [lockedGold](#lockedgold-endpoint) | `lockedGold` |

---

## LockedGold Endpoint

Query the total gold grams locked in [cache.gold](https://contract.cache.gold/api/lockedGold).

`lockedGold` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "lockedGold"
  }
}
```

Response:

```json
{
  "result": 91571.93
}
```

---
