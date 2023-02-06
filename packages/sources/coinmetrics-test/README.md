# COINMETRICS

![1.0.5](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinmetrics-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |            Description            |  Type  | Options |             Default             |
| :-------: | :-------------: | :-------------------------------: | :----: | :-----: | :-----------------------------: |
|    ✅     |     API_KEY     |      The coinmetrics API key      | string |         |                                 |
|           | WS_API_ENDPOINT | The websocket url for coinmetrics | string |         |  `wss://api.coinmetrics.io/v4`  |
|           |  API_ENDPOINT   |    The API url for coinmetrics    | string |         | `https://api.coinmetrics.io/v4` |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [price-ws](#price-ws-endpoint) | `price-ws` |

## Price-ws Endpoint

`price-ws` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  |          Options           | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :------------------------: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |                            |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string | `BTC`, `ETH`, `EUR`, `USD` |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
