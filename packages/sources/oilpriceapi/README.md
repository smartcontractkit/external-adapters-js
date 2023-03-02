# Chainlink OilpriceAPI External Adapter

![2.1.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/oilpriceapi/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.oilpriceapi.com/v1/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   | Description |  Type  | Options | Default |
| :-------: | :-----: | :---------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY |             | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name |              Aliases              |              Description              | Type |       Options        |     Default     | Depends On | Not Valid With |
| :-------: | :--: | :-------------------------------: | :-----------------------------------: | :--: | :------------------: | :-------------: | :--------: | :------------: |
|    ✅     | base | `asset`, `from`, `market`, `type` | The type of oil to get the price from |      | `brent`, `bz`, `wti` |                 |            |                |
|           | url  |                                   |          The endpoint to use          |      |                      | `prices/latest` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
