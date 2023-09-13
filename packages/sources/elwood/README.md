# ELWOOD

![2.1.19](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/elwood/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |            Description            |  Type  | Options |                  Default                   |
| :-------: | :-------------: | :-------------------------------: | :----: | :-----: | :----------------------------------------: |
|    ✅     |     API_KEY     |              API key              | string |         |                                            |
|           | WS_API_ENDPOINT | The websocket url for coinmetrics | string |         |  `wss://api.chk.elwood.systems/v1/stream`  |
|           |  API_ENDPOINT   |    The API url for coinmetrics    | string |         | `https://api.chk.elwood.systems/v1/stream` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                       Options                       | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#price-endpoint), [price](#price-endpoint) | `crypto` |

## Price Endpoint

Supported names for this endpoint are: `crypto`, `price`.

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
    "base": "ETH",
    "quote": "USD"
  }
}
```

---

MIT License
