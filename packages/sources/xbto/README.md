# Chainlink External Adapter for XBTO

![1.3.37](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/xbto/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://fpiw7f0axc.execute-api.us-east-1.amazonaws.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options | Default |
| :-------: | :----------: | :---------: | :----: | :-----: | :-----: |
|           | API_ENDPOINT |             |        |         |         |
|    ✅     |   API_KEY    |             | string |         |         |

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

| Required? |  Name  | Aliases | Description |  Type  |    Options     | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :---------: | :----: | :------------: | :-----: | :--------: | :------------: |
|           | market | `base`  |             | string | `brent`, `wti` | `brent` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "market": "brent",
    "endpoint": "price"
  },
  "debug": {
    "cacheKey": "kOklXsmmSkKwHHQ7Y3UJdk26rC8="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "index": 83.86309,
    "duration": 36.02185,
    "1st_sym": "BRNF2",
    "1st_dte": 21.03686,
    "1st_mid": 84.45,
    "1st_wt": 0.5005,
    "2nd_sym": "BRNG2",
    "2nd_dte": 51.03686,
    "2nd_mid": 83.275,
    "2nd_wt": 0.4995,
    "3rd_sym": "BRNH2",
    "3rd_dte": 83.03686,
    "3rd_mid": 82.22,
    "3rd_wt": 0,
    "result": 83.86309
  },
  "result": 83.86309,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "market": "wti",
    "endpoint": "price"
  },
  "debug": {
    "cacheKey": "ZFIDg0FVXiArti9zMRWkbguidY8="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "index": 82.5261,
    "duration": 35.83218,
    "1st_sym": "CLZ1",
    "1st_dte": 10.03456,
    "1st_mid": 83.92,
    "1st_wt": 0.1678186,
    "2nd_sym": "CLF2",
    "2nd_dte": 41.03456,
    "2nd_mid": 82.245,
    "2nd_wt": 0.8321814,
    "3rd_sym": "CLG2",
    "3rd_dte": 72.03456,
    "3rd_mid": 80.74,
    "3rd_wt": 0,
    "result": 82.5261
  },
  "result": 82.5261,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
