# Chainlink External Adapter for Fmp Cloud

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/fmpcloud/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://fmpcloud.io

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |        Default        |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------------------: |
|    ✅     |   API_KEY    |             | string |         |                       |
|           | API_ENDPOINT |             | string |         | `https://fmpcloud.io` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                   Options                                    | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#stock-endpoint), [quote](#stock-endpoint), [stock](#stock-endpoint) | `stock` |

## Stock Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `stock` endpoint instead.**

Supported names for this endpoint are: `price`, `quote`, `stock`.

### Input Params

| Required? | Name |     Aliases     |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `from` | The symbol of the currency to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
