# Chainlink External Adapter for Coinbase

Version: 1.2.17

Query information from [Coinbase's API](https://developers.coinbase.com/api/v2)

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |      Name       | Description |  Type  | Options |             Default              |
| :-------: | :-------------: | :---------: | :----: | :-----: | :------------------------------: |
|           |  API_ENDPOINT   |             | string |         |    `https://api.coinbase.com`    |
|           | WS_API_ENDPOINT |             | string |         | `wss://ws-feed.pro.coinbase.com` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                        Options                        | Default  |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [price](#crypto-endpoint) | `crypto` |

---

## Crypto Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? |  Name   |            Aliases            |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :---------------------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol  | `base`, `coin`, `from`, `sym` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | convert |    `market`, `quote`, `to`    | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "symbol": "BTC",
    "convert": "USD"
  },
  "rateLimitMaxAge": 370
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "base": "BTC",
      "currency": "USD",
      "amount": "57854.29"
    },
    "result": 57854.29
  },
  "result": 57854.29,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
