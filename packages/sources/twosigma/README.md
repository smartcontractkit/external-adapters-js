# TWOSIGMA

![1.2.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/twosigma/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                                                     Description                                                      |  Type  | Options |                  Default                  |
| :-------: | :-------------: | :------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :---------------------------------------: |
|    ✅     | WS_API_ENDPOINT | The WebSocket API URL. Either "wss://chainlinkcloud1.twosigma.com:8765" or "wss://chainlinkcloud1.twosigma.com:8766" | string |         | `wss://chainlinkcloud1.twosigma.com:8765` |
|    ✅     |   WS_API_KEY    |                                      The API key used to authenticate requests                                       | string |         |                                           |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                      Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint), [stock](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `price`, `stock`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
