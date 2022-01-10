# Chainlink External Adapter for Cache.gold

Version: 1.2.1

Query the total gold grams locked in [cache.gold](https://contract.cache.gold/api/lockedGold)

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |              Options               |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [lockedgold](#lockedgold-endpoint) | `lockedGold` |

---

## LockedGold Endpoint

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
  "grams_locked": "91571.93000000",
  "result": 91571.93
}
```
