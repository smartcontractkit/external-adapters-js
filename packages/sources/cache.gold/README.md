# Chainlink External Adapter for Cache.gold

![1.2.31](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cache.gold/package.json)

Base URL https://contract.cache.gold/api

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |              Default              |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://contract.cache.gold/api` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |              Options               |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [lockedGold](#lockedgold-endpoint) | `lockedGold` |

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
  },
  "debug": {
    "cacheKey": "aZoya+gFve1ms9ObNR40aMrNGvE="
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

MIT License
