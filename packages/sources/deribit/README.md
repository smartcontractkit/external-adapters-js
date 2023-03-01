# Chainlink External Adapter for Deribit

![1.2.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/deribit/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://www.deribit.com/api/v2/public/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |                 Default                  |
| :-------: | :----------: | :---------: | :----: | :-----: | :--------------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://www.deribit.com/api/v2/public/` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

`crypto` is the only supported name for this endpoint.

### Input Params

| Required? |   Name   |             Aliases              |             Description             | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :------------------------------: | :---------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | currency | `base`, `coin`, `from`, `symbol` | The symbol of the currency to query |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
