# DAR

![1.3.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/dar/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |           Description           |  Type  | Options |                    Default                     |
| :-------: | :-------------: | :-----------------------------: | :----: | :-----: | :--------------------------------------------: |
|           |  API_ENDPOINT   | Base URL for DAR REST endpoints | string |         | `https://api-beta.digitalassetresearch.com/v2` |
|           | WS_API_ENDPOINT |     WS URL for the DAR API      | string |         | `wss://dar-ws-400ms.digitalassetresearch.com`  |
|    ✅     |   WS_API_KEY    |       Key for the DAR API       | string |         |                                                |
|    ✅     | WS_API_USERNAME |    Username for the DAR API     | string |         |                                                |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                       Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [crypto](#price-endpoint), [price](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
