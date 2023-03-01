# Chainlink Polygon External Adapter

![1.7.14](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/polygon/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This adapter is for [Polygon.io](https://polygon.io/) and supports the conversion endpoint.

Base URL https://api.polygon.io

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                   Description                                    |  Type  | Options |           Default            |
| :-------: | :----------: | :------------------------------------------------------------------------------: | :----: | :-----: | :--------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://polygon.io/dashboard/signup) | string |         |                              |
|           | API_ENDPOINT |                                                                                  | string |         | `https://api.polygon.io/v1/` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                         Options                                                          |  Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [conversion](#conversion-endpoint), [forex](#tickers-endpoint), [price](#tickers-endpoint), [tickers](#tickers-endpoint) | `tickers` |

## Tickers Endpoint

Convert a currency or currencies into another currency or currencies

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `tickers` endpoint instead.**

Supported names for this endpoint are: `forex`, `price`, `tickers`.

### Input Params

| Required? | Name  | Aliases |             Description             | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :---------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `from`  | The symbol of the currency to query |      |         |         |            |                |
|    ✅     | quote |  `to`   | The symbol of the currency to query |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Conversion Endpoint

Get FOREX price conversions

`conversion` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |                 Description                  |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base    | `from`  |     The symbol of the currency to query      | string |         |         |            |                |
|    ✅     |   quote   |  `to`   |   The symbol of the currency to convert to   | string |         |         |            |                |
|           |  amount   |         |     The amount of the `base` to convert      | number |         |   `1`   |            |                |
|           | precision |         | The number of significant figures to include | number |         |   `6`   |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
