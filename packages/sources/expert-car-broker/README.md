# Chainlink External Adapter for Expert Car Broker

![1.3.35](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/expert-car-broker/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Adapter to get data from Expert Car Broker.

Base URL https://prices.expertcarbroker.workers.dev/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |                    Default                    |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------------------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://prices.expertcarbroker.workers.dev/` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |        Options         | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [feed](#feed-endpoint) | `feed`  |

## Feed Endpoint

`feed` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |     Description      |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | product |         | The product to query | string |         |         |            |                |
|    ✅     | feedId  |         |  The feed ID to use  | number |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "product": "ferrari-f12tdf",
    "feedId": 1,
    "endpoint": "feed"
  },
  "debug": {
    "cacheKey": "N+ZifCh5pNiaCwuYd+LTr8Ge6G4="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "value": 482421,
    "result": 482421
  },
  "result": 482421,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
