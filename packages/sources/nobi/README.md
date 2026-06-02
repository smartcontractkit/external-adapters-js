# NOBI

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/nobi/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Additional Env Variables

These env vars are available to configure the amount of WebSocket transports and subscriptions per transport that the adapter will manage. The defaults should be sufficient for most use cases:

- `MAX_TRANSPORTS`: The maximum number of WebSocket transports to manage. Default is 10.
- `MAX_SUBSCRIPTIONS_PER_TRANSPORT`: The maximum number of currency pairs to route through a single transport before routing to the next one. Default is 100.

## Environment Variables

| Required? |      Name       |          Description          |  Type  | Options |             Default             |
| :-------: | :-------------: | :---------------------------: | :----: | :-----: | :-----------------------------: |
|    ✅     |     API_KEY     | An API key for Data Provider  | string |         |                                 |
|           | WS_API_ENDPOINT | WS endpoint for Data Provider | string |         | `wss://ws.price.usenobi.com/v2` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                      Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint), [state](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `price`, `state`.

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
    "base": "BTC",
    "quote": "USD"
  }
}
```

---

MIT License
