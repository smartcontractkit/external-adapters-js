# Chainlink Polygon External Adapter

Version: 1.4.14

This adapter is for [Polygon.io](https://polygon.io/) and supports the conversion endpoint.

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     |                                   Description                                    |  Type  | Options |           Default            |
| :-------: | :----------: | :------------------------------------------------------------------------------: | :----: | :-----: | :--------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://polygon.io/dashboard/signup) | string |         |                              |
|           | API_ENDPOINT |                                                                                  | string |         | `https://api.polygon.io/v1/` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                         Options                                                          |  Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [conversion](#conversion-endpoint), [forex](#tickers-endpoint), [price](#tickers-endpoint), [tickers](#tickers-endpoint) | `tickers` |

---

## Tickers Endpoint

Convert a currency or currencies into another currency or currencies

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `tickers` endpoint instead.**

Supported names for this endpoint are: `forex`, `price`, `tickers`.

### Input Params

| Required? |   Name   |    Aliases     | Description | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :------------: | :---------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base   | `base`, `from` |             |      |         |         |            |                |
|    ✅     |  quote   | `quote`, `to`  |             |      |         |         |            |                |
|           | quantity |                |             |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "tickers",
    "base": "USD",
    "quote": "GBP"
  },
  "rateLimitMaxAge": 26666
}
```

Response:

```json
{
  "result": 28.5
}
```

---

## Conversion Endpoint

Get FOREX price conversions

`conversion` is the only supported name for this endpoint.

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
    "endpoint": "conversion",
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
  "result": 0.7536
}
```

---
