# Chainlink External Adapter for Mock data (Test only)

Version: 2.0.5

The Mock EA is to only be used by the integration team for soak testing. It will return a value that deviates after a given interval.

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |         Name          | Description |  Type  | Options | Default  |
| :-------: | :-------------------: | :---------: | :----: | :-----: | :------: |
|    ✅     | UPDATE_INTERVAL_IN_MS |             | string |         | `300000` |
|    ✅     |   DEVIATION_AMOUNT    |             | string |         |   `5`    |
|    ✅     |      MIN_RESULT       |             | string |         |          |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

---

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "price"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 1050
  },
  "result": 1050,
  "statusCode": 200
}
```

---
