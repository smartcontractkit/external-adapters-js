# IEXCLOUD

![1.0.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/iex-cloud-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                       Description                                       |  Type  | Options |              Default               |
| :-------: | :----------: | :-------------------------------------------------------------------------------------: | :----: | :-----: | :--------------------------------: |
|           | API_ENDPOINT |                               API endpoint for iex-cloud                                | string |         | `https://cloud.iexapis.com/stable` |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://iexcloud.io/cloud-login#/register/) | string |         |                                    |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                              Options                                                              | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [eod-close](#eod-endpoint), [eod](#eod-endpoint), [price](#crypto-endpoint), [stock](#stock-endpoint) | `stock` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |              Aliases              |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-------------------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `asset`, `coin`, `from`, `symbol` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote |          `market`, `to`           |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Stock Endpoint

`stock` is the only supported name for this endpoint.

### Input Params

| Required? | Name |              Aliases              |     Description     |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-------------------------------: | :-----------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol` | The symbol to query | string |         |         |            |                |

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
