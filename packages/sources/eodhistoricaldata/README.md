# Chainlink External Adapter for EOD Historical Data

![1.5.5](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/eodhistoricaldata/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |             Default             |
| :-------: | :----------: | :---------: | :----: | :-----: | :-----------------------------: |
|    ✅     |   API_KEY    |             | string |         |                                 |
|           | API_ENDPOINT |             | string |         | `https://eodhistoricaldata.com` |

---

## Data Provider Rate Limits

| Name | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |             Note              |
| :--: | :-------------------------: | :-------------------------: | :-----------------------: | :---------------------------: |
| all  |                             |                             |          4166.66          | all feeds have the same limit |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                    Options                                    | Default |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#stock-endpoint), [stock](#stock-endpoint), [uk_etf](#stock-endpoint) | `stock` |

## Stock Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `stock` endpoint instead.**

Supported names for this endpoint are: `price`, `stock`, `uk_etf`.

### Input Params

| Required? | Name |                  Aliases                   |                                                       Description                                                        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :----------------------------------------: | :----------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `etf`, `from`, `symbol`, `uk_etf` | The symbol of the currency to query taken from [here](https://eodhistoricaldata.com/financial-apis/category/data-feeds/) | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "FTSE"
  },
  "debug": {
    "cacheKey": "fc55ce9152c7ea4eed85318698956965d803ccc8"
  },
  "rateLimitMaxAge": 960
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "code": "FTSE.INDX",
    "timestamp": 1637858100,
    "gmtoffset": 0,
    "open": 7286.3198,
    "high": 7311.9399,
    "low": 7286.3198,
    "close": 7310.3701,
    "volume": 0,
    "previousClose": 7286.2998,
    "change": 24.0703,
    "change_p": 0.3304,
    "result": 7310.3701
  },
  "result": 7310.3701,
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
    "base": "IBTA",
    "overrides": {
      "eodhistoricaldata": {
        "IBTA": "IBTA.LSE"
      }
    }
  },
  "debug": {
    "cacheKey": "019ac546b4ae850cbe902f2d713ba1bb9f89363c"
  },
  "rateLimitMaxAge": 1920
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "code": "IBTA.LSE",
    "timestamp": 1637858100,
    "gmtoffset": 1,
    "open": 1286.3198,
    "high": 1311.9399,
    "low": 1286.3198,
    "close": 1310.3701,
    "volume": 0,
    "previousClose": 1286.2998,
    "change": 14.0703,
    "change_p": 1.3304,
    "result": 1310.3701
  },
  "result": 1310.3701,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
