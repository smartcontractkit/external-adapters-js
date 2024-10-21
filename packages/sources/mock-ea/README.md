# Chainlink External Adapter for Mock data (Test only)

![2.1.33](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/mock-ea/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

The Mock EA is to only be used by the integration team for soak testing. It will return a value that deviates after a given interval.

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          | Description |  Type  | Options | Default  |
| :-------: | :-------------------: | :---------: | :----: | :-----: | :------: |
|    ✅     | UPDATE_INTERVAL_IN_MS |             | string |         | `300000` |
|    ✅     |   DEVIATION_AMOUNT    |             | string |         |   `5`    |
|    ✅     |      MIN_RESULT       |             | string |         |          |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

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
  },
  "debug": {
    "cacheKey": "VrI9ktHz2Gp7oHbb2+1HMGmvh5k="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 950
  },
  "result": 950,
  "statusCode": 200
}
```

---

MIT License
