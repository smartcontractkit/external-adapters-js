# Chainlink External Adapter for CryptoMKT

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cryptomkt/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.exchange.cryptomkt.com/api/3/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |                   Default                   |
| :-------: | :----------: | :---------: | :----: | :-----: | :-----------------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://api.exchange.cryptomkt.com/api/3/` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                        Options                         | Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [ticker](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

**NOTE: the `ticker` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `ticker`.

### Input Params

| Required? | Name  |        Aliases         |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `fsym` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to`, `tsym` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
