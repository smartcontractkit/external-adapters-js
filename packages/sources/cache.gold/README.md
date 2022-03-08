# Chainlink External Adapter for Cache.gold

Version: 1.2.17

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |              Default              |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://contract.cache.gold/api` |

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
  "jobRunID": "1",
  "data": {
    "grams_locked": "91571.93000000",
    "result": 91571.93
  },
  "result": 91571.93,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
