# FINAGE

![1.1.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/finage-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                                                Options                                                                                | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [commodities](#commodities-endpoint), [crypto](#crypto-endpoint), [eod](#eod-endpoint), [forex](#forex-endpoint), [price](#crypto-endpoint), [stock](#stock-endpoint) | `stock` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |         Aliases          |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :----------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `symbol` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote |      `market`, `to`      |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Stock Endpoint

`stock` is the only supported name for this endpoint.

### Input Params

| Required? | Name |     Aliases      |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :--------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `from`, `symbol` | The symbol of the currency to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Eod Endpoint

`eod` is the only supported name for this endpoint.

### Input Params

| Required? | Name |     Aliases      |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :--------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `from`, `symbol` | The symbol of the currency to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Commodities Endpoint

`commodities` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |         Aliases          |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :----------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `symbol` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote |      `market`, `to`      |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Forex Endpoint

`forex` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |         Aliases          |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :----------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `symbol` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote |      `market`, `to`      |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
