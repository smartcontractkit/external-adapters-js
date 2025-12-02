# FINALTO

![1.2.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/finalto/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

# Known Issues

## Quote Endpoint Response Structure

The quote endpoint returns a response with nested data structures and some redundant fields. Below is an example response:

```json
{
  "result": 272.04499999999996,
  "data": {
    "result": 272.04499999999996,
    "bid": 272.02,
    "mid": 272.04499999999996,
    "ask": 272.07,
    "mid_price": 272.045,
    "bid_price": 272.02,
    "bid_volume": 10000,
    "ask_price": 272.07,
    "ask_volume": 10000
  }
}
```

## Field Relationships

### Price Fields

- **`result`**, **`data.result`**, and **`data.mid`**: All three fields contain the same value, calculated as `(bid + ask) / 2` (simple arithmetic mean)
- **`data.mid_price`**: Contains the liquidity-weighted mid price, which differs from the simple arithmetic mean

### Redundant Fields

- **`data.bid`** = **`data.bid_price`** (same value)
- **`data.ask`** = **`data.ask_price`** (same value)

### Volume Fields

- **`data.bid_volume`**: Volume available at the bid price
- **`data.ask_volume`**: Volume available at the ask price

## Environment Variables

| Required? |      Name       |          Description          |  Type  | Options | Default |
| :-------: | :-------------: | :---------------------------: | :----: | :-----: | :-----: |
|    ✅     | WS_API_USERNAME | API username for WS endpoint  | string |         |         |
|    ✅     | WS_API_PASSWORD | API password for WS endpoint  | string |         |         |
|    ✅     | WS_API_ENDPOINT | WS endpoint for Data Provider | string |         |         |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                               Options                                                                                | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [commodities](#quote-endpoint), [forex](#quote-endpoint), [fx](#quote-endpoint), [quote](#quote-endpoint), [stock](#quote-endpoint), [stock_quotes](#quote-endpoint) | `quote` |

## Quote Endpoint

Supported names for this endpoint are: `commodities`, `forex`, `fx`, `quote`, `stock`, `stock_quotes`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "quote",
    "base": "GBP",
    "quote": "USD"
  }
}
```

---

MIT License
