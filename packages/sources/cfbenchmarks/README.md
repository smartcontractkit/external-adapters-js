# CFBENCHMARKS

![2.4.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cfbenchmarks/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |           Name            |                               Description                                |  Type   | Options |                 Default                  |
| :-------: | :-----------------------: | :----------------------------------------------------------------------: | :-----: | :-----: | :--------------------------------------: |
|    ✅     |       API_USERNAME        |                    Username for the CFBenchmarks API                     | string  |         |                                          |
|    ✅     |       API_PASSWORD        |                    Password for the CFBenchmarks API                     | string  |         |                                          |
|           |       API_ENDPOINT        |                      The default REST API base url                       | string  |         |    `https://www.cfbenchmarks.com/api`    |
|           |      WS_API_ENDPOINT      |                    The default WebSocket API base url                    | string  |         |    `wss://www.cfbenchmarks.com/ws/v4`    |
|           |       API_SECONDARY       |                 Toggle using the secondary API base URLs                 | boolean |         |                 `false`                  |
|           |  SECONDARY_API_ENDPOINT   |   The secondary REST API base url that is toggled using API_SECONDARY    | string  |         | `https://unregprod.cfbenchmarks.com/api` |
|           | SECONDARY_WS_API_ENDPOINT | The secondary WebSocket API base url that is toggled using API_SECONDARY | string  |         | `wss://unregprod.cfbenchmarks.com/ws/v4` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                          Options                                                                                                           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [birc](#birc-endpoint), [crypto-lwba](#crypto-lwba-endpoint), [crypto](#crypto-endpoint), [crypto_lwba](#crypto-lwba-endpoint), [cryptolwba](#crypto-lwba-endpoint), [price](#crypto-endpoint), [values](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `price`, `values`.

### Input Params

| Required? |        Name         |    Aliases     |                            Description                             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----------------: | :------------: | :----------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           |        index        |                | The ID of the index. Takes priority over base/quote when provided. | string |         |         |            |                |
|           |        base         | `coin`, `from` |           The symbol of symbols of the currency to query           | string |         |         |            |                |
|           |        quote        | `market`, `to` |              The symbol of the currency to convert to              | string |         |         |            |                |
|           | adapterNameOverride |                |  Used internally for override and metrics, do not set this field   | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "crypto",
    "base": "LINK",
    "quote": "USD"
  }
}
```

---

## Birc Endpoint

`birc` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |                  Description                  |  Type  |                        Options                         | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :-------------------------------------------: | :----: | :----------------------------------------------------: | :-----: | :--------: | :------------: |
|    ✅     | tenor |         | The tenor value to pull from the API response | string | `1M`, `1W`, `2M`, `2W`, `3M`, `3W`, `4M`, `5M`, `SIRB` |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "birc",
    "tenor": "SIRB"
  }
}
```

---

## Crypto-lwba Endpoint

Supported names for this endpoint are: `crypto-lwba`, `crypto_lwba`, `cryptolwba`.

### Input Params

| Required? |        Name         |    Aliases     |                            Description                             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----------------: | :------------: | :----------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           |        index        |                | The ID of the index. Takes priority over base/quote when provided. | string |         |         |            |                |
|           |        base         | `coin`, `from` |           The symbol of symbols of the currency to query           | string |         |         |            |                |
|           |        quote        | `market`, `to` |              The symbol of the currency to convert to              | string |         |         |            |                |
|           | adapterNameOverride |                |  Used internally for override and metrics, do not set this field   | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "crypto-lwba",
    "base": "LINK",
    "quote": "USD"
  }
}
```

---

MIT License
