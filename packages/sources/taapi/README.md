# Chainlink External Adapter for taapi.io

![1.2.32](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/taapi/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.taapi.io/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   | Description |  Type  | Options | Default |
| :-------: | :-----: | :---------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY |             | string |         |         |

---

## Data Provider Rate Limits

|    Name    | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :--------: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
|    free    |                             |              1              |                           |      |
|   basic    |              1              |                             |                           |      |
|    pro     |             10              |                             |                           |      |
|   expert   |             20              |                             |                           |      |
| privatevps |             50              |                             |                           |      |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |             Options              |   Default   |
| :-------: | :------: | :-----------------: | :----: | :------------------------------: | :---------: |
|           | endpoint | The endpoint to use | string | [indicator](#indicator-endpoint) | `indicator` |

## Indicator Endpoint

`indicator` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    |    Aliases     |                Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------------: | :---------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | indicator |                |         The TA indicator to query         |        |         |         |            |                |
|    ✅     |   base    | `coin`, `from` | The base currency in the market to query  | string |         |         |            |                |
|    ✅     |   quote   | `market`, `to` | The quote currency in the market to query | string |         |         |            |                |
|    ✅     | exchange  |                |       The exchange to get data from       |        |         |         |            |                |
|    ✅     | interval  |                |         The time interval to use          |        |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "BTC",
    "quote": "USDT",
    "exchange": "binance",
    "indicator": "avgprice",
    "interval": "1h"
  },
  "debug": {
    "cacheKey": "71cd2331edf138075e0eaf02d900d8bea1d8a3d6"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 66470.04250000001
  },
  "result": 66470.04250000001,
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
    "base": "BTC",
    "quote": "USDT",
    "exchange": "binance",
    "indicator": "cci",
    "interval": "1h"
  },
  "debug": {
    "cacheKey": "49fc570d9836f96bec30bd81db27e131181cf97e"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": -109.20727257685407
  },
  "result": -109.20727257685407,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
