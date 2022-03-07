# Chainlink External Adapter for Expert Car Broker

Version: 1.2.17

Adapter to get data from Expert Car Broker.

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |                    Default                    |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------------------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://prices.expertcarbroker.workers.dev/` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |        Options         | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [feed](#feed-endpoint) | `feed`  |

---

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
    "endpoint": "feed",
    "product": "ferrari-f12tdf",
    "feedId": 1
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
