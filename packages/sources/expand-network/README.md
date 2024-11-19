# EXPAND_NETWORK

![0.1.4](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/expand-network/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                   Description                   |  Type  | Options |             Default              |
| :-------: | :-------------: | :---------------------------------------------: | :----: | :-----: | :------------------------------: |
|           | WS_API_ENDPOINT | WS endpoint for expand.network price aggregator | string |         | `wss://aggregate.expand.network` |
|    ✅     |     API_KEY     | An API key for expand.network price aggregator  | string |         |                                  |

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
    "base": "wstETH",
    "quote": "ETH"
  }
}
```

---

MIT License
