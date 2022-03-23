# Chainlink External Adapter for taapi.io

Version: 1.1.21

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   | Description |  Type  | Options | Default |
| :-------: | :-----: | :---------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY |             | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |             Options              |   Default   |
| :-------: | :------: | :-----------------: | :----: | :------------------------------: | :---------: |
|           | endpoint | The endpoint to use | string | [indicator](#indicator-endpoint) | `indicator` |

---

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
