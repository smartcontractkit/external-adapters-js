# Chainlink Polygon External Adapter

Version: 1.3.1

This adapter is for [Polygon.io](https://polygon.io/) and supports the conversion endpoint. NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `forex` endpoint instead.

## Environment Variables

| Required? |     Name     |                                   Description                                    |  Type  | Options |           Default            |
| :-------: | :----------: | :------------------------------------------------------------------------------: | :----: | :-----: | :--------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://polygon.io/dashboard/signup) | string |         |                              |
|           | API_ENDPOINT |                                                                                  | string |         | `https://api.polygon.io/v1/` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                        Options                         | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [forex](#forex-endpoint), [tickers](#tickers-endpoint) | `forex` |

---

## Forex Endpoint

Supported names for this endpoint are: `forex`, `price`.

### Input Params

| Required? |   Name    | Aliases |                 Description                  |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base    | `from`  |     The symbol of the currency to query      | string |         |         |            |                |
|    ✅     |   quote   |  `to`   |   The symbol of the currency to convert to   | string |         |         |            |                |
|           |  amount   |         |     The amount of the `base` to convert      | number |         |   `1`   |            |                |
|           | precision |         | The number of significant figures to include | number |         |   `6`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "forex",
    "base": "USD",
    "quote": "GBP",
    "amount": 1,
    "precision": 6
  },
  "rateLimitMaxAge": 13333
}
```

Response:

```json
{
  "converted": 0.7536,
  "from": "USD",
  "initialAmount": 1,
  "last": {
    "ask": 0.7537,
    "bid": 0.7536,
    "exchange": 48,
    "timestamp": 1638296882000
  },
  "request_id": "744873f269fecf272b15c6f665a94438",
  "status": "success",
  "symbol": "USD/GBP",
  "to": "GBP",
  "result": 0.7536
}
```

---

## Tickers Endpoint

`tickers` is the only supported name for this endpoint.

### Input Params

| Required? |   Name   |    Aliases     | Description | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :------------: | :---------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base   | `base`, `from` |             |      |         |         |            |                |
|    ✅     |  quote   | `quote`, `to`  |             |      |         |         |            |                |
|           | quantity |                |             |      |         |         |            |                |

There are no examples for this endpoint.
