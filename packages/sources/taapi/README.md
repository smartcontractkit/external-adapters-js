# Chainlink External Adapter for taapi.io

Version: 1.1.1

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
|    ✅     |   base    | `from`, `coin` | The base currency in the market to query  | string |         |         |            |                |
|    ✅     |   quote   | `to`, `market` | The quote currency in the market to query | string |         |         |            |                |
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
  "result": 66470.04250000001
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
  "result": -109.20727257685407
}
```

</details>
