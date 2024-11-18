# OANDA

![1.1.34](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/oanda/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |           Name           |            Description             |  Type  | Options |                  Default                  |
| :-------: | :----------------------: | :--------------------------------: | :----: | :-----: | :---------------------------------------: |
|    ✅     |         API_KEY          |     API key for REST endpoint      | string |         |                                           |
|    ✅     |      API_ACCOUNT_ID      |           API Account ID           | string |         |                                           |
|           |       API_ENDPOINT       |      Endpoint for REST prices      | string |         | `https://exchange-rates-api.oanda.com/v2` |
|           | INSTRUMENTS_API_ENDPOINT | Endpoint for REST instruments list | string |         |    `https://api-fxtrade.oanda.com/v3`     |
|    ✅     |       SSE_API_KEY        |      API key for SSE endpoint      | string |         |                                           |
|           |     SSE_API_ENDPOINT     | Endpoint for SSE streaming prices  | string |         |   `https://stream-fxtrade.oanda.com/v3`   |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                      Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [forex](#price-endpoint), [price](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `forex`, `price`.

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
    "endpoint": "price",
    "base": "CAD",
    "quote": "USD"
  }
}
```

---

MIT License
