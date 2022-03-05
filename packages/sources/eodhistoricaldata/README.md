# Chainlink External Adapter for EOD Historical Data

Version: 1.2.17

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |             Default             |
| :-------: | :----------: | :---------: | :----: | :-----: | :-----------------------------: |
|    ✅     |   API_KEY    |             | string |         |                                 |
|           | API_ENDPOINT |             | string |         | `https://eodhistoricaldata.com` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                      Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#stock-endpoint), [stock](#stock-endpoint) | `stock` |

---

## Stock Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `stock` endpoint instead.**

Supported names for this endpoint are: `price`, `stock`.

### Input Params

| Required? | Name |          Aliases          |                                                       Description                                                        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------: | :----------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `from`, `symbol` | The symbol of the currency to query taken from [here](https://eodhistoricaldata.com/financial-apis/category/data-feeds/) | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "FTSE"
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

---
