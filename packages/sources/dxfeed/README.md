# Chainlink External Adapter for dxFeed

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/dxfeed/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |         Description          |  Type  | Options |                  Default                   |
| :-------: | :----------: | :--------------------------: | :----: | :-----: | :----------------------------------------: |
|    ✅     | API_USERNAME |                              | string |         |                                            |
|    ✅     | API_PASSWORD |                              | string |         |                                            |
|           | API_ENDPOINT | The endpoint for your dxFeed | string |         | `https://tools.dxfeed.com/webservice/rest` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                 Options                                                                 | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [commodities](#price-endpoint), [crypto](#price-endpoint), [forex](#price-endpoint), [price](#price-endpoint), [stock](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `commodities`, `crypto`, `forex`, `price`, `stock`.

### Input Params

| Required? | Name |         Aliases          |             Description             | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :----------------------: | :---------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from`, `market` | The symbol of the currency to query |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
