# Chainlink External Adapter for Binance DEX

![1.6.19](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/binance-dex/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

The following `base` and `quote` pair must be taken from [this list](https://dex.binance.org/api/v1/markets)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                     Description                      |  Type  |                                               Options                                                |      Default      |
| :-------: | :----------: | :--------------------------------------------------: | :----: | :--------------------------------------------------------------------------------------------------: | :---------------: |
|           | API_ENDPOINT | Environment variable to set the API endpoint to use. | string | `dex-asiapacific`, `dex-atlantic`, `dex-european`, `testnet-dex-asiapacific`, `testnet-dex-atlantic` | `dex-asiapacific` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
