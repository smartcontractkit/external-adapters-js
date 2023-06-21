# INTRINIO

![2.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/intrinio/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |       Description        |  Type  | Options |            Default             |
| :-------: | :----------: | :----------------------: | :----: | :-----: | :----------------------------: |
|           | API_ENDPOINT | The API url for intrinio | string |         | `https://api-v2.intrinio.com/` |
|           |   API_KEY    | The API key for intrinio | string |         |                                |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                      Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint), [stock](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `price`, `stock`.

### Input Params

| Required? | Name |     Aliases     |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-------------: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `from` | The symbol of the asset to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
