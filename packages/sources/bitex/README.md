# Chainlink External Adapter for Bitex

![1.5.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/bitex/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://bitex.la/api

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |     Description      |  Type  | Options |        Default         |
| :-------: | :----------: | :------------------: | :----: | :-----: | :--------------------: |
|           | API_ENDPOINT |                      | string |         | `https://bitex.la/api` |
|           |   API_KEY    | Bitex API key to use | string |         |                        |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                         Options                         | Default  |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [tickers](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `tickers`.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
