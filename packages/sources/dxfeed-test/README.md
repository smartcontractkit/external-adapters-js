# DXFEED

![1.3.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/dxfeed-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |         Description          |  Type  | Options |                  Default                   |
| :-------: | :-------------: | :--------------------------: | :----: | :-----: | :----------------------------------------: |
|           |  API_USERNAME   |   username for dxfeed API    | string |         |                                            |
|           |  API_PASSWORD   |   password for dxfeed API    | string |         |                                            |
|           | WS_API_ENDPOINT | The websocket url for dxfeed | string |         |                                            |
|           |  API_ENDPOINT   |    The API url for dxfeed    | string |         | `https://tools.dxfeed.com/webservice/rest` |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                                 Options                                                                 | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [commodities](#price-endpoint), [crypto](#price-endpoint), [forex](#price-endpoint), [price](#price-endpoint), [stock](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `commodities`, `crypto`, `forex`, `price`, `stock`.

### Input Params

| Required? | Name |         Aliases          |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :----------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from`, `market` | The symbol of the currency to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
