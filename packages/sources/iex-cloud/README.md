# Chainlink External Adapter for IEX Cloud

![1.2.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/iex-cloud/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://cloud.iexapis.com/stable

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |              Default               |
| :-------: | :----------: | :---------: | :----: | :-----: | :--------------------------------: |
|    ✅     |   API_KEY    |             | string |         |                                    |
|           | API_ENDPOINT |             | string |         | `https://cloud.iexapis.com/stable` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                Options                                                 | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [eod-close](#eod-endpoint), [eod](#eod-endpoint), [stock](#stock-endpoint) | `stock` |

## Stock Endpoint

`stock` is the only supported name for this endpoint.

### Input Params

| Required? | Name |              Aliases              |     Description     |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-------------------------------: | :-----------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol` | The symbol to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Crypto Endpoint

`crypto` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |              Aliases              |       Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-------------------------------: | :----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `asset`, `coin`, `from`, `symbol` |   The symbol to query    | string |         |         |            |                |
|    ✅     | quote |          `market`, `to`           | The symbol to convert to | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Eod Endpoint

Supported names for this endpoint are: `eod`, `eod-close`.

### Input Params

| Required? | Name |              Aliases              |     Description     |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-------------------------------: | :-----------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol` | The symbol to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
