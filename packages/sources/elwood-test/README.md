# ELWOOD

![1.1.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/elwood-test/package.json)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |            Description            |  Type  | Options |                  Default                   |
| :-------: | :-------------: | :-------------------------------: | :----: | :-----: | :----------------------------------------: |
|    ✅     |     API_KEY     |              API key              | string |         |                                            |
|           | WS_API_ENDPOINT | The websocket url for coinmetrics | string |         |  `wss://api.chk.elwood.systems/v1/stream`  |
|           |  API_ENDPOINT   |    The API url for coinmetrics    | string |         | `https://api.chk.elwood.systems/v1/stream` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                    Options                                     | Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [cryptoEndpoint](#cryptoendpoint-endpoint), [crypto](#cryptoendpoint-endpoint) | `crypto` |

## CryptoEndpoint Endpoint

Supported names for this endpoint are: `crypto`, `cryptoEndpoint`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
