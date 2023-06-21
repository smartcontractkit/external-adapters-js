# TP

![1.1.6](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tp/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |         Description          |  Type  | Options |                           Default                           |
| :-------: | :-------------: | :--------------------------: | :----: | :-----: | :---------------------------------------------------------: |
|    ✅     | WS_API_USERNAME |   API user for WS endpoint   | string |         |                                                             |
|    ✅     | WS_API_PASSWORD | API password for WS endpoint | string |         |                                                             |
|           | WS_API_ENDPOINT |    Endpoint for WS prices    | string |         | `ws://json.mktdata.portal.apac.parametasolutions.com:12000` |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                      Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [forex](#price-endpoint), [price](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `forex`, `price`.

### Input Params

| Required? |   Name   |    Aliases     |                        Description                        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :------------: | :-------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base   | `coin`, `from` |      The symbol of symbols of the currency to query       | string |         |         |            |                |
|    ✅     |  quote   | `market`, `to` |         The symbol of the currency to convert to          | string |         |         |            |                |
|           | tpSource |                | Source of price data for this price pair on the TP stream | string |         |  `GBL`  |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
