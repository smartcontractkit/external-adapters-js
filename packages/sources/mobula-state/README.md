# MOBULA_STATE

![1.1.4](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/mobula-state/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |          Description          |  Type  | Options |         Default         |
| :-------: | :-------------: | :---------------------------: | :----: | :-----: | :---------------------: |
|           | WS_API_ENDPOINT | WS endpoint for Data Provider | string |         | `wss://feed.zobula.xyz` |
|    ✅     |     API_KEY     | An API key for Data Provider  | string |         |                         |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                    Options                                    | Default |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [crypto](#price-endpoint), [price](#price-endpoint), [state](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `crypto`, `price`, `state`.

### Input Params

| Required? | Name  |              Aliases               |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `market`, `symbol` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote |          `convert`, `to`           |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "base": "ETH",
    "quote": "USD"
  }
}
```

---

MIT License
