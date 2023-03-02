# CFBENCHMARKS

![1.1.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cfbenchmarks-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

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

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                      Options                                      | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [price](#crypto-endpoint), [values](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `price`, `values`.

### Input Params

| Required? | Name  |    Aliases     |                            Description                             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :----------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           | index |                | The ID of the index. Takes priority over base/quote when provided. | string |         |         |            |                |
|           | base  | `coin`, `from` |           The symbol of symbols of the currency to query           | string |         |         |            |                |
|           | quote | `market`, `to` |              The symbol of the currency to convert to              | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
